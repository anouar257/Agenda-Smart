FROM eclipse-temurin:21-jdk AS builder
WORKDIR /build
COPY ai-service/pom.xml ./pom.xml
COPY ai-service/src ./src
COPY pom.xml ../pom.xml
RUN apt-get update && apt-get install -y maven && \
    mvn clean package -DskipTests

FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=builder /build/target/*.jar app.jar
EXPOSE 8081
ENTRYPOINT ["java", "-jar", "app.jar"]
