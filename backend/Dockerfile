FROM maven:3-openjdk-11-slim AS build
WORKDIR /synbiohub3
COPY pom.xml /synbiohub3
COPY src /synbiohub3/src
RUN mvn -B package --file pom.xml -DskipTests
FROM openjdk:11-slim
COPY --from=build /target/*.jar app.jar
EXPOSE 6379
ENTRYPOINT ["java","-jar","app.jar"]
