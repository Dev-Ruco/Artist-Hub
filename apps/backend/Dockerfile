FROM maven:3.9-eclipse-temurin-21 AS construcao
WORKDIR /codigo
COPY pom.xml ./
RUN mvn -B -q dependency:go-offline
COPY src ./src
RUN mvn -B -q verify -DskipTests

FROM eclipse-temurin:21-jre
WORKDIR /aplicacao
COPY --from=construcao /codigo/target/plataforma-api-0.1.0.jar ./aplicacao.jar
USER 10001
ENV JAVA_TOOL_OPTIONS="-XX:MaxRAMPercentage=70.0 -Dfile.encoding=UTF-8"
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "/aplicacao/aplicacao.jar"]
