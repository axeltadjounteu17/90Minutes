# 90Minutes - The Ultimate Live Football Companion App

🏆 **[LIVE DEMO APP (CloudFront)](https://dkpob5pujhskg.cloudfront.net)**  
📄 **[Download Documentation (PDF)](./Documentation.pdf)**  

*(Scroll down for English 🇬🇧 and German 🇩🇪 versions)*

---

## 🇫🇷 Français

### 🎯 Le Projet
**90Minutes** est une plateforme innovante conçue pour révolutionner l'expérience de visionnage du football en direct (en s'appuyant sur les données de la Bundesliga / DFL). L'application transforme le statut passif du spectateur en une expérience hautement **interactive, gamifiée et sociale**. 

Au lieu de simplement regarder le match, les fans rejoignent des *Rooms* (salons virtuels), interagissent en temps réel, prédisent les scores, et vivent l'action racontée par une Intelligence Artificielle générative d'Amazon.

### ⚙️ Technologies & Services AWS Utilisés
Le projet a été pensé pour la production, avec une architecture 100% Serverless déployée via **AWS CDK (Cloud Development Kit)**.

#### 1. Intelligence Artificielle (GenAI)
*   **Amazon Bedrock (Nova Micro)** : C'est le cœur de notre fonctionnalité phare. L'IA génère des commentaires sportifs uniques et émotionnels en direct. Elle ingère les métriques de la DFL (xG, vitesse du tir, distance) et crée instantanément un récit passionnant pour chaque événement du match.

#### 2. Infrastructure Cloud & Serverless (AWS)
*   **AWS API Gateway (WebSocket & HTTP)** : Maintient les connexions bidirectionnelles persistantes avec les joueurs pour la diffusion des événements en direct, sans aucun délai.
*   **AWS Lambda** : 10 fonctions distinctes gèrent toute la logique métier (création de rooms, diffusion en direct des événements, authentification des connexions WebSocket, requêtes vers Bedrock Nova).
*   **Amazon DynamoDB** : Base de données NoSQL ultra-rapide avec un schéma optimisé (modèle Single-Table) pour stocker l'état de la partie, les données des joueurs et les classements.
*   **Amazon CloudFront & Amazon S3** : Hébergement du frontend compilé en PWA (Progressive Web App). CloudFront sert de CDN global avec compression GZIP et forçage HTTPS pour des temps de chargement instantanés.
*   **Amazon CloudWatch** : Configuration de Dashboards et d'Alarmes pour surveiller les métriques des fonctions Lambda et la santé globale de l'API.

#### 3. Frontend & DevSecOps
*   **React Native & Expo Router** : Application Cross-platform (Web, iOS, Android) avec une architecture composable et des animations fluides via Reanimated. Support natif multilingue (FR, EN, DE).
*   **GitHub Actions (CI/CD)** : Pipeline d'intégration et de déploiement continus qui compile le code et le pousse automatiquement sur S3 lors des fusions.

### 🎮 Comment utiliser la Démo ?
1. Rendez-vous sur notre lien **CloudFront**.
2. Entrez votre nom de fan (ex: "Alex").
3. **Rejoignez une Room** pour voir les autres fans connectés.
4. **Faites vos prédictions** avant le match (score final) pour remporter un maximum de points.
5. **Lancez la Démo** : Une simulation condensée de 5 minutes rejoue un match réel (données DFL XML). Observez les KPIs (xG) se transformer en commentaires générés par **Amazon Nova**.
6. Gagnez des **points et des badges** (Sniper, Champion) selon vos performances !

---

## 🇬🇧 English

### 🎯 The Project
**90Minutes** is an innovative platform designed to revolutionize the live football viewing experience (leveraging Bundesliga / DFL data). The app shifts fans from passive viewers to active participants in a highly **interactive, gamified, and social** environment.

Instead of just watching the game, fans join *Rooms*, interact in real-time, predict scores, and experience the action narrated by Amazon's Generative AI.

### ⚙️ Technologies & AWS Services Used
The project was built as a production-ready application, featuring a 100% Serverless architecture deployed via **AWS CDK**.

#### 1. Artificial Intelligence (GenAI)
*   **Amazon Bedrock (Nova Micro)**: The core of our standout feature. The AI generates unique, emotional live sports commentary. It ingests DFL metrics (xG, shot speed, distance) and instantly crafts an engaging narrative for every match event.

#### 2. Cloud Infrastructure & Serverless (AWS)
*   **AWS API Gateway (WebSocket & HTTP)**: Maintains persistent bidirectional connections for zero-latency live event broadcasting.
*   **AWS Lambda**: 10 separate functions handle the business logic (room creation, live event dispatching, WebSocket connection auth, Bedrock Nova invocations).
*   **Amazon DynamoDB**: Lightning-fast NoSQL database utilizing Single-Table Design to store game state, players, and leaderboards.
*   **Amazon CloudFront & Amazon S3**: Hosts the compiled PWA frontend. CloudFront acts as a global CDN ensuring HTTPS encryption, GZIP compression, and instant load times.
*   **Amazon CloudWatch**: Dashboards and Alarms to monitor Lambda metrics and overall API health.

#### 3. Frontend & DevSecOps
*   **React Native & Expo Router**: Cross-platform app (Web, iOS, Android) with smooth Reanimated animations and native multi-language support (FR, EN, DE).
*   **GitHub Actions (CI/CD)**: Continuous integration and deployment pipeline that builds and automatically pushes the codebase to S3 on merge.

### 🎮 How to run the Demo?
1. Open our **CloudFront** live link.
2. Enter a Fan Name (e.g., "Alex").
3. **Join a Room** to see other connected fans.
4. **Make Predictions** before the match to earn maximum points.
5. **Launch the Demo**: A condensed 5-minute simulation replays a real match (using DFL XML data). Watch how advanced KPIs (xG) are transformed into dynamic commentary by **Amazon Nova**.
6. Earn **points and badges** (Sniper, Champion) based on your performance!

---

## 🇩🇪 Deutsch

### 🎯 Das Projekt
**90Minutes** ist eine innovative Plattform, die das Live-Fußball-Erlebnis (mit Bundesliga / DFL-Daten) revolutionieren soll. Die App verwandelt Zuschauer in aktive Teilnehmer in einer **interaktiven, spielerischen und sozialen** Umgebung.

Fans treten *Räumen* bei, interagieren in Echtzeit, tippen Ergebnisse und erleben das Spiel, kommentiert von der generativen KI von Amazon.

### ⚙️ Technologien & genutzte AWS-Dienste
Das Projekt wurde als produktionsreife Anwendung mit einer 100% Serverless-Architektur über **AWS CDK** entwickelt.

#### 1. Künstliche Intelligenz (GenAI)
*   **Amazon Bedrock (Nova Micro)**: Das Herzstück unseres Hauptfeatures. Die KI generiert einzigartige, emotionale Live-Sportkommentare. Sie verarbeitet DFL-Metriken (xG, Schussgeschwindigkeit, Distanz) und erstellt sofort eine fesselnde Erzählung für jedes Spielereignis.

#### 2. Cloud-Infrastruktur & Serverless (AWS)
*   **AWS API Gateway (WebSocket & HTTP)**: Sorgt für latenzfreie, bidirektionale Verbindungen für Live-Übertragungen.
*   **AWS Lambda**: 10 Funktionen verwalten die Geschäftslogik (Räume erstellen, Events übertragen, Bedrock Nova abfragen).
*   **Amazon DynamoDB**: Ultraschnelle NoSQL-Datenbank im Single-Table-Design zum Speichern von Spielstatus und Ranglisten.
*   **Amazon CloudFront & Amazon S3**: Hosting des PWA-Frontends mit einem globalen CDN für sofortige Ladezeiten und sicheres HTTPS.
*   **Amazon CloudWatch**: Dashboards und Alarme zur Überwachung der Backend-Gesundheit.

#### 3. Frontend & DevSecOps
*   **React Native & Expo Router**: Cross-Platform-App (Web, iOS, Android) mit nativer Mehrsprachigkeit (FR, EN, DE).
*   **GitHub Actions (CI/CD)**: Automatisierte Tests und Deployments auf S3.

### 🎮 Wie nutzt man die Demo?
1. Öffnen Sie unseren **CloudFront**-Link.
2. Geben Sie einen Fan-Namen ein.
3. **Treten Sie einem Raum bei**.
4. **Geben Sie Ihre Tipps ab**, um Punkte zu sammeln.
5. **Starten Sie die Demo**: Eine auf 5 Minuten verdichtete Simulation spielt ein echtes Match (DFL XML-Daten) nach. Erleben Sie, wie KPIs von **Amazon Nova** in Echtzeit-Kommentare verwandelt werden.
6. Gewinnen Sie **Punkte und Abzeichen**!
