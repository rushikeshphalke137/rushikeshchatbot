import sys
import random
from datetime import datetime, timedelta, date

def daterange(start_date, end_date):
    for n in range(int ((end_date - start_date).days)):
        yield start_date + timedelta(n)

_, fake_hrr_file, start, end, root_dir=sys.argv

# Read the fake HHR list into a list of dicts
hrr_list=[]

fin=open(fake_hrr_file, 'r')
hrrnum=0
hrrcity=""
hrr_beds=0
total_pop=0
objectid=0
count=0

print("Reading HRR File")

for line in fin:
    count += 1
    modulo = count % 5
    if modulo == 0:  
        object_id = int(line.strip())
        hrr_dict = {"hrrnum": hrrnum, "hrrcity": hrrcity.upper(), "hrr_beds": hrr_beds, "total_pop": total_pop, "objectid": objectid}
        hrr_list.append(hrr_dict)
        hrrnum=0
        hrrcity=""
        hrr_beds=0
        total_pop=0
        objectid=0
    elif modulo == 1:
        hrrnum = int(line.strip())
    elif modulo == 2:
        hrrcity = line.strip()
    elif modulo == 3:
        hrr_beds = int(line.strip())
    elif modulo == 4:
        total_pop = int(line.strip())

fin.close()
print("Closed fin file")

# Open nssac_ncov_ro_summary.csv
full_summary_file = open(root_dir + "/nssac_ncov_ro-summary.csv", "w")
# full_summary_file.write("date,Total Beds Avail,Total Vent. Avail,Total Staff Avail,Total Hospitalized,Total Vents Demanded,Total Staff Demanded,Total Beds Count,Total Vent. Count,Total Staff Count,Total Cases\n")
full_summary_file.write("date,Total Projected Demand (%),Total Hospitalizations,Lower Hospitalization Bound,Upper Hospitalization Bound\n")

print("Creating and initializing HHR files")
# Loop through the HRRs and create their region_summary files
region_file=open(root_dir + "/nssac_ncov_ro_region_list.csv", "w")
region_file.write("All Regions\n")

for hrr in hrr_list:
    region_file.write(f"{hrr['hrrcity']}\n")
    hrr_file = open(root_dir + "/regions/nssac_ncov_ro_summary_hrr_" + str(hrr["hrrnum"]) + ".csv", "w")
    # hrr_file.write("date,Total Beds Avail,Total Vent. Avail,Total Staff Avail,Total Hospitalized,Total Vent. Demanded,Total Staff Demanded,Total Beds Count,Total Vent. Count,Total Staff Count,Total Cases\n")
    hrr_file.write("date,Total Projected Demand (%),Total Hospitalizations,Lower Hospitalization Bound,Upper Hospitalization Bound\n")
    hrr_file.close()
region_file.close()

# Loop through the dates and hrr_list to generate files for each hrr, then 
start_date = datetime.strptime(start,"%m-%d-%Y")
end_date = datetime.strptime(end, "%m-%d-%Y")
seed = 4
print("Looping through dates")
for single_date in daterange(start_date, end_date):
    temp_date = single_date.strftime("%m-%d-%Y")
    dateFile = open(root_dir + "/nssac_ncov_ro_" + temp_date + ".csv", "w")
    # dateFile.write("HRRNum,Hospital Referral Region,Last Update,Beds Avail,Vent. Avail,Staff Avail,Hospitalized,Vents Demanded,Staff Demanded,Beds Count,Vent. Count,Staff Count,Cases\n")
    dateFile.write("HRRNum,Hospital Referral Region,Projected Demand (%),Hospitalizations,Lower Hospitalization Bound,Upper Hospitalization Bound,Last Update\n")

    totalBedsAvail = 0
    totalVentsAvail = 0
    totalStaffAvail = "NA"
    totalBedsCount = 0
    totalVentsCount = 0
    totalStaffCount = "NA"
    totalBedsNeeded = 0
    totalVentsNeeded = 0
    totalStaffNeeded = "NA"
    totalCases = 0

    for hrr in hrr_list:
        hrr_bed_count = hrr["hrr_beds"]
        totalBedsCount += hrr_bed_count
        # totalVentsCount += int(hrr["hrr_beds"] / 2)
        hrr_cases = seed*seed*random.randint(1,10)
        hrr_beds = seed*random.randint(1,10)
        hrr_vents = int(hrr_beds*random.randint(1,3)/ 10)
        # hrr_beds_avail = hrr["hrr_beds"] - hrr_beds
        print(f"hrr_bed_count {hrr_bed_count}")
        hrr_proj_need = int(((0.8 * hrr_bed_count) + hrr_beds)*100/hrr_bed_count)
        print(f"hrr_proj_need {hrr_proj_need}")
        hrr_vents_avail = int(hrr["hrr_beds"] / 2) - hrr_vents
        # totalBedsAvail += hrr_beds_avail
        # totalVentsAvail += hrr_vents_avail
        # totalCases += hrr_cases
        totalBedsNeeded += hrr_beds
        # totalVentsNeeded += hrr_vents
        # if hrr_beds_avail < 0:
        #    hrr_beds_avail = 0
        # if hrr_vents_avail < 0:
        #    hrr_vents_avail = 0
        hrr_file = open("regions/nssac_ncov_ro_summary_hrr_" + str(hrr["hrrnum"]) + ".csv", "a")
        # hrr_file.write(f"{temp_date},{hrr_beds_avail},{hrr_vents_avail},NA,{str(hrr_beds)},{str(hrr_vents)},NA,{hrr['hrr_beds']},{int(hrr['hrr_beds']/2)},NA,{str(hrr_cases)}\n")
        lower_bound = int(hrr_beds - hrr_beds*0.05)
        upper_bound = int(hrr_beds + hrr_beds*0.05)
        hrr_file.write(f"{temp_date},{hrr_proj_need},{str(hrr_beds)},{str(lower_bound)},{str(upper_bound)}\n")
        hrr_file.close()
        # dateFile.write(f"{str(hrr['hrrnum'])},{hrr['hrrcity']},{temp_date},{str(hrr_beds_avail)},{str(hrr_vents_avail)},NA,{str(hrr_beds)},{str(hrr_vents)},NA,{str(hrr['hrr_beds'])},{str(int(hrr['hrr_beds'] / 2))},NA,{str(hrr_cases)}\n")
        dateFile.write(f"{str(hrr['hrrnum'])},{hrr['hrrcity']},{str(hrr_proj_need)},{str(hrr_beds)},{str(lower_bound)},{str(upper_bound)},{temp_date}\n")
        
    # full_summary_file.write(f"{temp_date},{totalBedsAvail},{totalVentsAvail},{totalStaffAvail},{totalBedsNeeded},{totalVentsNeeded},{totalStaffNeeded},{totalBedsCount},{totalVentsCount},{totalStaffCount},{totalCases}\n")
    total_proj_need = int(((0.8 * totalBedsCount) + totalBedsNeeded)*100/totalBedsCount)
    lower_bound = int(totalBedsNeeded - totalBedsNeeded*0.05)
    upper_bound = int(totalBedsNeeded + totalBedsNeeded*0.05)
    full_summary_file.write(f"{temp_date},{total_proj_need},{totalBedsNeeded},{lower_bound},{upper_bound}\n")
    dateFile.close()
    seed = seed + 2
full_summary_file.close()
print("finished")
