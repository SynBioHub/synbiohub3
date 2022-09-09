# SynBioHub3 Backend

_This installation guide has not been fully tested. Please let Daniel (learner97 on GitHub) know if there are any issues._

## **Installing the Backend from Source**

Source is recommended for development and debugging. 

#### _Environment Setup_
IntelliJ IDEA is highly recommended for backend development.

The community edition is free to download: [IntelliJ](https://www.jetbrains.com/idea/download/)

University students can also commonly get the Pro Edition for free. 

VSCode and other IDEs are acceptable alternatives. 

Make sure that a JDK is installed on your machine.
Java version 11 or greater is recommended. The most recent LTS version is Java 17. 

| OS     | Command                   |
|--------|---------------------------|
| Ubuntu | apt install `default-jdk` |
| Mac    | brew install `openjdk`    |

Install Maven. IntelliJ has built-in Maven, so not required. 

| OS     | Command              |
|--------|----------------------|
| Ubuntu | apt install `maven`  |
| Mac    | brew install `maven` |


#### _Project Setup_

Navigate to the desired directory in your terminal.
``git clone https://github.com/SynBioHub/synbiohub3.git``

Open ``backend`` as a project in IntelliJ.

To setup your JDK, go to ``File``->``Project Structure``->``Project``->``ProjectSDK``
and click on your downloaded Java JDK.

If you're not using IntelliJ:
To build a JAR file using maven, navigate to the ``backend`` directory and run:

``mvn package``

and run the JAR file with

``java -jar target/{name of JAR}``

#### _Running_

The main class is the ``Synbiohub3Application`` class.

- Click ``Edit Configuration`` in the top panel.
- Click `+` in the top left and select ``Application``.
- Give your configuration a name.
- Make sure your installed JDK is selected.
- Make sure ``com.synbiohub.sbh3.Synbiohub3Application`` is the main class.
- Set ``../synbiohub3/synbiohub3/backend`` as your working directory. 
- You're ready to Run!

Note: If packages or dependencies aren't found, click on ``Maven`` in the top right corner
and click ``Reload all Maven projects``.

## **Installing the Backend from Docker**

Docker is recommended for normal use and testing. 

#### _Environment Setup_

Make sure Git and Docker are installed. 

Git

| OS      | Command                                 |
|:--------|:----------------------------------------|
| Ubuntu  | ``sudo apt install git-all``            |
| Mac     | ``git --version``                       |
| Windows | [git](https://git-scm.com/download/win) |

Docker

| OS     | Command/Link                                             |
|--------|----------------------------------------------------------|
| Ubuntu | [Docker](https://docs.docker.com/engine/install/ubuntu/) |
| Mac    | ``brew install --cask docker``                           |

Check if Docker was installed correctly by running:
``docker run hello-world``

#### _Project Setup_

Go to the SynBioHub3 backend Docker image on the [DockerHub](https://hub.docker.com/r/synbiohub/sbh3backend).

Copy the pull command ``docker pull synbiohub/sbh3backend:snapshot`` and enter it in a Terminal.

**Note**: Make sure ``:snapshot`` is at the end of the command. 

Use Docker Desktop to start and stop the SynBioHub3 backend.

## Setting up Virtuoso from Docker

[Virtuoso OpenSource 7](https://hub.docker.com/r/openlink/virtuoso-opensource-7)

#### _Environment Setup_

First, install Docker.

| OS     | Command/Link                                             |
|--------|----------------------------------------------------------|
| Ubuntu | [Docker](https://docs.docker.com/engine/install/ubuntu/) |
| Mac    | ``brew install --cask docker``                           |

Check if Docker was installed correctly by running:
``docker run hello-world``

#### _Run Database_

Run ``docker pull openlink/virtuoso-opensource-7`` in a Terminal to pull the Image.

Next, in the terminal, navigate to the directory that you want to hold the docker container. 
``cd ../virtuoso_directory``

In that directory, now input the following command to create an instance of the docker image.

```
docker run \
    --name virtuoso_directory \
    --interactive \
    --tty \
    --env DBA_PASSWORD=dba \
    --publish 1111:1111 \
    --publish  8890:8890 \
    --volume `pwd`:/database \
    openlink/virtuoso-opensource-7:latest
```

**Note**: In the first line, your "name" should be the name of the directory you
want to the docker container in.

Use Docker Desktop to start and stop Virtuoso.

``Ctrl + c`` can also be used to close the Virtuoso server.

If this the first installation of Virtuoso, you need to add SPARQL update rights to the dba user in Virtuoso.
* Visit localhost:8890, click conductor on the left-hand side, and login with username dba and password dba.
* Visit system admin -> user accounts in the menu at the top.
* Find the account labeled dba and edit.
* Add SPARQL_UPDATE to roles using the menu at the bottom.
* If no dba account exists, add one, then add update rights.

## **Setting up Virtuoso from Source**

This is not recommended.

#### _Ubuntu_
1. Install Virtuoso 7 from source at [Virtuoso OpenSource](https://github.com/openlink/virtuoso-opensource)
* Switch to the branch stable/7 before installing.
* Follow the README on installing virtuoso from source.
  This involves installing all the dependencies and running build commands.
* Currently, Virtuoso does not support versions of OpenSSL 1.1.0 and above, or versions of OpenSSL below 1.0.0.
  When installing the dependency, build from a binary between those versions from [OpenSSL](https://www.openssl.org/source/).
2. Set up the Node.js repository
   1. Download the Node setup script `curl -sL https://deb.nodesource.com/setup_6.x | sudo -E bash -`
   2. Update your package repositories `sudo apt update`
3. Install the necessary packages `sudo apt install default-jdk maven raptor2-utils nodejs jq build-essential python`
4. Start virtuoso process `virtuoso-t +configfile /usr/local/virtuoso-opensource/var/lib/virtuoso/db/virtuoso.ini -f`

#### _MacOS_
1. Go to terminal: ``brew install virtuoso``
2. `cd /usr/local/Cellar/virtuoso/7.2.5.1_1/var/lib/virtuoso/db`
   * The command above is based on where the virtuoso.ini file is located. Your installation might be located
     somewhere different than `/usr/local/Cellar/virtuoso/7.2.5.1_1/var/lib/virtuoso/db`, or the version might be
     different (`7.2.5.1_1` might be `7.3.6.1_1` or any other version number).
   * If you're having trouble finding the location of the virtuoso.ini file, run `sudo find / -name virtuoso.ini`.
     Press the control and c keys simultaneously to quit the search.
3. `virtuoso-t -f`