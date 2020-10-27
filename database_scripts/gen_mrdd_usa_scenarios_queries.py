#!/usr/bin/env python3
"""
This script will read 'supported_scenarios.json' file present into /data_us/ directory, will generate a sql file with insert statements to insert data into 'usa_hrr_mrdd_scenarios' table. It generates 'queries_mrdd_usa_scenarios.sql' with the insert queries.
   
Created : 09/16/2020

By Komal K. Dudakiya

"""

import json
import os
import psycopg2
from pathlib import Path

def readScenariosData():
    #print(f"73 - readScenariosData() Started")

    file_name = Path(f'{(os.environ["BASE_DIR_PATH"])}/data_us_durations/supported_scenarios.json')
    #print(f"#73 - file_name = {file_name}")

    schema_name = os.environ["SCHEMA_NAME"]
    data_table = f"{schema_name}.usa_mrdd_scenarios"
    host_name = os.environ["HOST_NAME"]
    db_name = os.environ["DB_NAME"]

    #out_file = open(f'queries_mrdd_usa_scenarios.sql', "w")
    #out_file.write(f'-- script generated by gen_mrdd_usa_scenarios_queries.py --\n')
    #out_file.write("\n-----------------------------------------------\n")
    #out_file.write("-- insert scenarios data from supported_scenarios.json file \n")

    with open(file_name) as scenariosFile:
        dataDict = json.load(scenariosFile)

    defaultDuration = dataDict['configuration']['defaultDuration']
    try:
        defaultDuration = int(dataDict['configuration']['defaultDuration'])
    except (ValueError):
        defaultDuration = -1

    scenariosList = dataDict['scenarios']
    #print(f"#73 - scenariosList = {scenariosList}")
    
    scenarioNames = "'"
    connection = None
    
    for item in scenariosList:

        #scenario_id, name, description, start_date, end_date
        #insert_str = f'INSERT INTO {data_table} (name, description, data_directory, default_duration) VALUES '+"\n"

        currScenName, currDuration, currDescription, currDataDirectory = ''.join({item['scenario_display_name_line1']}), ''.join({item['scenario_display_name_line2']}), ''.join({item['description']}), ''.join({item['directory']})
        #print(f"#73 - currScenName = {currScenName}, currDuration = {currDuration}, currDescription = {currDescription}, currDataDirectory = {currDataDirectory}")
        currDescription = currDescription.replace("'", "''")

        concatScenName = currScenName + " " + currDuration
        #print(f"#73 - concatScenName = {concatScenName}")

        #---- Connect to database - Start ----#        

        try:
           connection = psycopg2.connect(
                                          #user="uname",
                                          #password="passwd",
                                          host=f"{host_name}",
                                          port="5432",
                                          database=f"{db_name}")
           cursor = connection.cursor()
           postgreSQL_select_Query = (f"SELECT name, end_date FROM {data_table} WHERE name = '{concatScenName}';")
           #print(f"postgreSQL_select_Query = {postgreSQL_select_Query}")

           cursor.execute(postgreSQL_select_Query)
           num_of_rows = cursor.rowcount
           #print(f"#73 - num_of_rows Selected = {num_of_rows}")
           #scenario_records = cursor.fetchall()

           if not num_of_rows:
                #print("New Scenario")
                scenarioNames += concatScenName + "','"
                #insert_str += f"('{concatScenName}','{currDescription}','{currDataDirectory}',{defaultDuration}),\n"
                postgreSQL_Insert_Query = (f"INSERT INTO {data_table} (name, description, data_directory, default_duration) VALUES ('{concatScenName}','{currDescription}','{currDataDirectory}',{defaultDuration});")
                #print(f"postgreSQL_Insert_Query = {postgreSQL_Insert_Query}")
                cursor.execute(postgreSQL_Insert_Query)
                num_of_rows = cursor.rowcount
                #print(f"#73 - num_of_rows Inserted = {num_of_rows}")
           else:
                scenarioNames += concatScenName + "','"
                postgreSQL_Update_Query = (f"UPDATE {data_table} SET last_update=NOW() WHERE name = '{concatScenName}';")
                #print(f"postgreSQL_Update_Query = {postgreSQL_Update_Query}")
                cursor.execute(postgreSQL_Update_Query)
                postgreSQL_Update_Query = (f"UPDATE {data_table} SET description='{currDescription}' WHERE name = '{concatScenName}';")
                #print(f"postgreSQL_Update_Query = {postgreSQL_Update_Query}")
                cursor.execute(postgreSQL_Update_Query)

		#print {scenarioNames}
        except (Exception, psycopg2.Error) as error :
            print ("PostgreSQL Message (Insert) : ", error)

        finally:            
            #closing database connection.
            if(connection):
                connection.commit()
                cursor.close()
                connection.close()
                #print("PostgreSQL connection is closed")

        #---- Connect to database - End ----#



        #insert_str += f"('{concatScenName}','{currDescription}','{currDataDirectory}',{defaultDuration}),\n"
        #print(f"current_insert_str = {insert_str}")

        #out_file.write(f"{insert_str[:-2]};"+"\n")
        
    # -- Update end_date of scenarios which are no longer used -- Start #
    #print(f"73 - scenarioNames = {scenarioNames[:-2]}")
    try:
           connection = psycopg2.connect(
                                          #user="uname",
                                          #password="passwd",
                                          host=f"{host_name}",
                                          port="5432",
                                          database=f"{db_name}")
           cursor = connection.cursor()           
           postgreSQL_Update_Query = (f"UPDATE {data_table} SET end_date=NOW() WHERE name IN (SELECT name FROM {data_table} WHERE name NOT IN ({scenarioNames[:-2]}) AND end_date IS NULL);")
           #print(f"postgreSQL_Update_Query = {postgreSQL_Update_Query}")

           cursor.execute(postgreSQL_Update_Query)
           num_of_rows = cursor.rowcount
           #print(f"#73 - num_of_rows updated = {num_of_rows}")
           
    except (Exception, psycopg2.Error) as error :
            print ("PostgreSQL Message (Update): ", error)

    finally:
        #closing database connection.
        if(connection):
            connection.commit()
            cursor.close()
            connection.close()
            #print("PostgreSQL connection is closed")

    # -- Update end_date of scenarios which are no longer used -- Start #
    #out_file.write(f"SELECT COUNT(*) AS SCENARIO_RECORDS_INSERTED FROM {data_table};")
    #out_file.write(f"\\q \n")
    #out_file.close()

def main():
    #print(f"main() Started")
    readScenariosData()

if __name__ == '__main__':
   main()
