FROM maven:3-openjdk-11-slim AS build
WORKDIR /synbiohub3
COPY pom.xml /synbiohub3
COPY src /synbiohub3/src
RUN mvn -B package --file pom.xml -DskipTests
FROM openjdk:11-slim
COPY --from=build /synbiohub3/target/*SNAPSHOT.jar app.jar
EXPOSE 7777
ENTRYPOINT ["java","-jar","app.jar"]
