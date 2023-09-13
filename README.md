# BactBook
Interpret and explore [Bactopia](https://bactopia.github.io) analysis in a simple web app.

PostgreSQL database supports the application by storing users, favourites and more. This projects user interface is built off of the existing Staphbook project, which can be found [here](https://github.com/maiscodes/Staphbook)

With this app, users are able to:
- browse genomes and view information such as isolation source and sequence data and be able to download the information as .csv files.
- find similar genomes by shared information such as isolation sources and by genetic distance
- favorite and tag samples by adding them to a group which can then be shared and viewed by other users
- annotate groups and view generic statistics about each group

## Prerequisites
- Node.js 
- PostgresSQL v14
- [Mash](https://github.com/marbl/Mash) for distance estimation features
- Bactopia Output Files (V3.00)
  - Old folder structure currently supported, recommended to download data from releases.
<details>
<summary>Node.js</summary>
  
> NodeJs is a Javascript Runtime - It's where all the server-side JS can run
1. Download here: https://nodejs.org/en
2. Follow the installer
</details>


<details>
  <summary>PostgreSQL</summary>
  
> PostgreSQL is our database of choice, although other database technologies may work. 
1. Download here: https://www.postgresql.org/download/
2. Once installed, it is highly recommended that you use a GUI such as pgAdmin 4 which can be downloaded here: https://www.pgadmin.org/download
3. Setup a Postgres server and database (keep your username and password handy, you'll need it later!)
</details>

<details>
  <summary>Mash</summary>
  
> Mash compares genome scketch files produced by Bactopia, allowing for genetic distance estimations.

<details>
<summary>Linux/MacOS</summary>
Follow the instructions to install here: https://github.com/marbl/Mash,
or install with Conda. Double check with:
```bash
  mash --version
``` 
No errors and you're good to go!
</details>
<details>
<summary>Windows</summary>
We find that using [WSL](https://learn.microsoft.com/en-us/windows/wsl/install) for mash works just fine, only slightly impacting loading times for the relevant page components. It only takes a few commands:

(Skip this one if you already have WSL installed)
```bash
wsl --install
```
Enter the WSL shell and install mash with the following commands:
```bash
wsl
sudo apt update && sudo apt upgrade -y
sudo apt install mash -y
```
That should be it! Double check everything worked with
```
mash --version
```
</details>
</details> 

<details>
  <summary>
    Bactopia File Outputs
  </summary>

> If you are here, you probably know about Bactopia. But it's important to note that this application
> expects a specific file structure, so this is worth a read.
<details>
  <summary>I Don't Have Any Bactopia Files</summary>
  Don't worry, some examples can be found under the 'Releases' section to the right.
1. Download the zip file and extract to your local disk
2. Note the path of the directory `bactopia-samples` (to be included in `.env` file)
</details>
Using flat-files as a database, we had to make some rules on how the application will interact with the file-system.
Below is the expected directory structure, nesting directories of samples within SAMPLES_DIR is not compatible. (note that SAMPLES_DIR can be anywhere local to the server):

```
SAMPLES_DIR/
├─ SAMPLE_1/
│  ├─ main/
│  │  ├─ ...
│  ├─ tools/
│  │  ├─ ...
├─ SAMPLE_2/
│  ├─ main/
│  │  ├─ ...
│  ├─ tools/
│  │  ├─ ...
├─ SAMPLE_N/
│  ├─ main/
│  │  ├─ ...
│  ├─ tools/
│  │  ├─ ...
```
</details>

## Running BactBook
With all prerequisites installed, there's just a couple more steps before you're on your way to exploring BactBook.
1. Database Creation Scripts
With a Postgres database server created and running locally, the scripts can be executed from the command line:
```{bash}
cd Nodewebsite/sql
psql {db_name} < bactopia_role.sql
psql {db_name} < create_tables.sql
```
2. Environment Variables

Copy `template.env` and rename it to simply `.env`. Fill in all variables and save.

|             | description                                                                                                                                                                                                                                                   |
|-------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| PORT        | Network port to listen for connections (default 3000)                                                                                                                                                                                                         |
| SAMPLES_DIR | Directory where all your Bactopia outputs live (see above for expected structure)                                                                                                                                                                             |
| DB_HOST     | Hostname for Database (probably 'localhost' or 127.0.0.1 if running local database)                                                                                                                                                                           |
| DB_PORT     | Exposed port for database (5432 by default in Postgres)                                                                                                                                                                                                       |
| DB_DB       | Database name (we call ours Bactbook)                                                                                                                                                                                                                         |
| DB_USER     | Username for database, must have read and write permissions                                                                                                                                                                                                   |
| DB_PASS     | Database password for above user                                                                                                                                                                                                                              |
| SECRET      | Secret key for authenticating sessions. Should be secret and random.                                                                                                                                                                                          |
| DEBUG       | Used for turning on/off debug logs. If something isn't working as expected, this might help find the culprit. <br>`# Print out logs from files in the routes folder only`<br> `DEBUG=routes:*` <br> `# Print out logs from both routes and utils` <br> `DEBUG=utils:*,routes:*` |


4. NPM Install
`cd` into `Nodewebsite/` and run:
```
npm install
```
After a few seconds, all the required packages should be installed and you're ready to run!
6. Spin It Up
Still inside `Nodewebsite/`, run:
```
node app.js
```
If all goes well, you should be greeted with a nice message letting you know everything is working. 

Go to http://localhost:3000 (or other host and port that you're using) and enjoy!




