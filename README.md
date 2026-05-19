# 90Minutes - The Ultimate Live Football Companion App

🏆 **[LIVE DEMO APP (CloudFront)](https://dkpob5pujhskg.cloudfront.net)**  
📄 **[Download Documentation (PDF)](./Documentation.pdf)**  

*(Scroll down for English 🇬🇧 and German 🇩🇪 versions)*

## 🇫🇷 Français

### Introduction
**90Minutes** est une plateforme cross-platform innovante conçue pour révolutionner l'expérience de visionnage du football en direct (en l'occurrence la Bundesliga). Grâce à l'utilisation de données réelles (DFL) et d'intelligence artificielle, l'application transforme un simple match en une expérience interactive, gamifiée et sociale.

### Comment ça marche ? (La Démo)
1. **Accès** : Rendez-vous sur notre lien en direct (CloudFront CDN).
2. **Inscription/Connexion** : Saisissez un nom de fan.
3. **Rejoindre une Room** : Créez ou rejoignez une room existante pour partager l'expérience avec d'autres fans.
4. **Prédictions** : Avant le début de la simulation, essayez de deviner le score final pour gagner des points.
5. **Lancer la Démo** : Cliquez sur "Lancer la démo". La simulation commence : des événements réels (issus de matchs de Bundesliga) sont diffusés via WebSockets en temps réel sur 5 minutes.
6. **Interaction IA** : Chaque événement de match (but, carton) est commenté en direct par l'IA d'Amazon (Nova Micro) en fonction des statistiques avancées (vitesse du tir, xG, distance).
7. **Réactions & Badges** : Envoyez des réactions en direct et débloquez des badges dans votre profil.

### Architecture & Technologies
Ce projet a été bâti comme une **application de production complète**, et non comme un simple prototype. 
- **Frontend** : React Native avec Expo Router (Cross-platform Web/iOS/Android), Zustand/Contexts pour l'état, et support multilingue (i18n).
- **Backend (Serverless AWS)** : Déployé via AWS CDK.
  - **API Gateway (WebSocket & HTTP)** pour le temps réel et les routes API.
  - **AWS Lambda** : 10 fonctions (gestion des connexions, diffusion, création de room).
  - **DynamoDB** : Bases de données NoSQL pour stocker l'état du match, les joueurs et l'historique.
  - **Amazon Bedrock (Nova Micro)** : Génération de commentaires sportifs dynamiques.
  - **CloudFront & S3** : CDN pour un chargement instantané (HTTPS compressé).
  - **CloudWatch** : Alarmes et tableau de bord de monitoring pour suivre la santé du backend.
- **CI/CD** : GitHub Actions pour automatiser les tests et le déploiement sur S3/CloudFront.

---

## 🇬🇧 English

### Introduction
**90Minutes** is an innovative cross-platform platform designed to revolutionize the live football viewing experience (specifically the Bundesliga). By leveraging real match data (DFL) and Artificial Intelligence, the app transforms a simple match into an interactive, gamified, and social experience.

### How to use it? (The Demo)
1. **Access**: Go to our live link (CloudFront CDN).
2. **Login**: Enter a fan name.
3. **Join a Room**: Create or join an existing room to share the experience with other fans.
4. **Predictions**: Before the simulation starts, guess the final score to earn points.
5. **Start Demo**: Click "Launch Demo". The simulation begins: real events (from Bundesliga matches) are broadcasted via WebSockets in real-time over 5 minutes.
6. **AI Narration**: Every match event (goal, card) is commented live by Amazon AI (Nova Micro) based on advanced stats (shot speed, xG, distance).
7. **Reactions & Badges**: Send live reactions and unlock badges in your profile.

### Architecture & Technologies
This project was built as a **production-ready application**, not just a simple prototype.
- **Frontend**: React Native with Expo Router (Cross-platform Web/iOS/Android), Contexts for state management, and multi-language support (i18n).
- **Backend (AWS Serverless)**: Deployed via AWS CDK.
  - **API Gateway (WebSocket & HTTP)** for real-time and API routes.
  - **AWS Lambda**: 10 distinct functions (connection handling, broadcasting, room creation).
  - **DynamoDB**: NoSQL databases to store match state, players, and history.
  - **Amazon Bedrock (Nova Micro)**: Generation of dynamic sports commentary.
  - **CloudFront & S3**: CDN for instant loading (compressed HTTPS).
  - **CloudWatch**: Alarms and monitoring dashboard to track backend health.
- **CI/CD**: GitHub Actions to automate tests and deployment to S3/CloudFront.

---

## 🇩🇪 Deutsch

### Einführung
**90Minutes** ist eine innovative plattformübergreifende Anwendung, die das Live-Fußball-Erlebnis (insbesondere die Bundesliga) revolutionieren soll. Durch die Nutzung echter Spieldaten (DFL) und Künstlicher Intelligenz verwandelt die App ein einfaches Spiel in ein interaktives, spielerisches und soziales Erlebnis.

### Wie benutzt man es? (Die Demo)
1. **Zugriff**: Besuchen Sie unseren Live-Link (CloudFront CDN).
2. **Anmeldung**: Geben Sie einen Fan-Namen ein.
3. **Raum beitreten**: Erstellen Sie einen Raum oder treten Sie einem bestehenden bei, um das Erlebnis mit anderen Fans zu teilen.
4. **Vorhersagen**: Tippen Sie vor Beginn der Simulation das Endergebnis, um Punkte zu sammeln.
5. **Demo starten**: Klicken Sie auf "Demo starten". Die Simulation beginnt: Echte Ereignisse (aus Bundesligaspielen) werden über WebSockets 5 Minuten lang in Echtzeit übertragen.
6. **KI-Kommentar**: Jedes Spielereignis (Tor, Karte) wird von der Amazon-KI (Nova Micro) live kommentiert, basierend auf erweiterten Statistiken (Schussgeschwindigkeit, xG, Distanz).
7. **Reaktionen & Abzeichen**: Senden Sie Live-Reaktionen und schalten Sie Abzeichen in Ihrem Profil frei.

### Architektur & Technologien
Dieses Projekt wurde als **produktionsreife Anwendung** und nicht nur als einfacher Prototyp entwickelt.
- **Frontend**: React Native mit Expo Router (Cross-Plattform Web/iOS/Android) und mehrsprachiger Unterstützung (i18n).
- **Backend (AWS Serverless)**: Bereitgestellt über AWS CDK.
  - **API Gateway (WebSocket & HTTP)** für Echtzeit- und API-Routen.
  - **AWS Lambda**: 10 verschiedene Funktionen.
  - **DynamoDB**: NoSQL-Datenbanken zum Speichern von Spielstatus und Spielern.
  - **Amazon Bedrock (Nova Micro)**: Generierung dynamischer Sportkommentare.
  - **CloudFront & S3**: CDN für sofortiges Laden (komprimiertes HTTPS).
  - **CloudWatch**: Alarme und Monitoring-Dashboard.
- **CI/CD**: GitHub Actions zur Automatisierung von Tests und Bereitstellung.
