import sys
import random
from datetime import datetime, timedelta, date

def daterange(start_date, end_date):
    for n in range(int ((end_date - start_date).days)):
        yield start_date + timedelta(n)

_, fake_hrr_file, start, end=sys.argv

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
        hrr_dict = {"hrrnum": hrrnum, "hrrcity": hrrcity, "hrr_beds": hrr_beds, "total_pop": total_pop, "objectid": objectid}
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
full_summary_file = open("nssac_ncov_ro-summary.csv", "w")
full_summary_file.write("date,Total Beds Avail,Total Vent. Avail,Total Staff Avail,Total Beds Needed,Total Vents Needed,Total Staff Needed,Total Beds Count,Total Vent. Count,Total Staff Count,Total Cases\n")

print("Creating and initializing HHR files")
# Loop through the HRRs and create their region_summary files
region_file=open("nssac_ncov_ro_region_list.csv", "w")
region_file.write("All Regions\n")

for hrr in hrr_list:
    region_file.write(f"{hrr['hrrcity']}\n")
    hrr_file = open("regions/nssac_ncov_ro_summary_hrr_" + str(hrr["hrrnum"]) + ".csv", "w")
    hrr_file.write("date,Total Beds Avail,Total Vent. Avail,Total Staff Avail,Total Beds Needed,Total Vent. Needed,Total Staff Needed,Total Beds Count,Total Vent. Count,Total Staff Count,Total Cases\n")
    hrr_file.close()
region_file.close()

# Loop through the dates and hrr_list to generate files for each hrr, then 
start_date = datetime.strptime(start,"%m-%d-%Y")
end_date = datetime.strptime(end, "%m-%d-%Y")
seed = 5
print("Looping through dates")
for single_date in daterange(start_date, end_date):
    temp_date = single_date.strftime("%m-%d-%Y")
    dateFile = open("nssac_ncov_ro_" + temp_date + ".csv", "w")
    dateFile.write("HRRNum,HRR City,Last Update,Beds Avail,Vent. Avail,Staff Avail,Beds Needed,Vents Needed,Staff Needed,Beds Count,Vent. Count,Staff Count,Cases\n")

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
        totalBedsCount += hrr["hrr_beds"]
        totalVentsCount += int(hrr["hrr_beds"] / 2)
        hrr_cases = seed*seed*random.randint(1,10)
        hrr_beds = seed*random.randint(1,10)
        hrr_vents = int(hrr_beds*random.randint(1,3)/ 10)
        hrr_beds_avail = hrr["hrr_beds"] - hrr_beds
        hrr_vents_avail = int(hrr["hrr_beds"] / 2) - hrr_vents
        totalBedsAvail += hrr_beds_avail
        totalVentsAvail += hrr_vents_avail
        totalCases += hrr_cases
        totalBedsNeeded += hrr_beds
        totalVentsNeeded += hrr_vents
        if hrr_beds_avail < 0:
            hrr_beds_avail = 0
        if hrr_vents_avail < 0:
            hrr_vents_avail = 0
        hrr_file = open("regions/nssac_ncov_ro_summary_hrr_" + str(hrr["hrrnum"]) + ".csv", "a")
        hrr_file.write(f"{temp_date},{hrr_beds_avail},{hrr_vents_avail},NA,{str(hrr_beds)},{str(hrr_vents)},NA,{hrr['hrr_beds']},{int(hrr['hrr_beds']/2)},NA,{str(hrr_cases)}\n")
        hrr_file.close()
        dateFile.write(f"{str(hrr['hrrnum'])},{hrr['hrrcity']},{temp_date},{str(hrr_beds_avail)},{str(hrr_vents_avail)},NA,{str(hrr_beds)},{str(hrr_vents)},NA,{str(hrr['hrr_beds'])},{str(int(hrr['hrr_beds'] / 2))},NA,{str(hrr_cases)}\n")
        
    full_summary_file.write(f"{temp_date},{totalBedsAvail},{totalVentsAvail},{totalStaffAvail},{totalBedsNeeded},{totalVentsNeeded},{totalStaffNeeded},{totalBedsCount},{totalVentsCount},{totalStaffCount},{totalCases}\n")
    dateFile.close()
    seed = seed + 2
full_summary_file.close()
print("finished")
