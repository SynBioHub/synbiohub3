FROM maven:3-openjdk-17-slim AS build
WORKDIR /synbiohub3
COPY backend/pom.xml /synbiohub3
COPY backend/src /synbiohub3/src/
RUN mvn -B package --file pom.xml -DskipTests
FROM openjdk:17-slim
WORKDIR /synbiohub3
# Copy src directory over
COPY --from=build /synbiohub3/src/main/ src/main/
# Copy JAR file over
COPY --from=build /synbiohub3/target/*SNAPSHOT.jar app.jar 
RUN apt-get update && apt-get install --no-install-recommends -y \   
 vim-tiny \  
 && apt-get clean && rm -rf /var/lib/apt/lists/*
EXPOSE 6789 
#HEALTHCHECK --start-period=60s \
     # CMD curl -f localhost:6789/rootCollections || exit 1 
ENTRYPOINT ["java","-jar","app.jar"]
