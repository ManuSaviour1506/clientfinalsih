# 🏆 Khel Pratibha — AI Sports Talent Assessment Platform

An end-to-end **AI-powered sports analytics platform** designed to democratize talent identification by leveraging **computer vision, machine learning, and scalable cloud architecture**.

---

## 🌐 Overview

Khel Pratibha is a production-grade platform that enables athletes to upload performance videos and receive **objective, data-driven evaluations** using AI. The system eliminates geographical, financial, and infrastructural barriers in traditional talent scouting.

Athletes can record a short video using a smartphone and receive:

- 📊 Score out of 10  
- 🧠 AI-generated performance insights  
- 📈 Detailed analytics and feedback  
- 🏆 Ranking on a national leaderboard  

---

## 🎯 Problem Statement

Traditional sports talent identification suffers from:

- Lack of standardized evaluation metrics  
- High dependency on human coaches  
- Limited accessibility for rural athletes  
- High operational costs  
- Absence of structured performance data  

---

## 💡 Solution

Designed a **distributed AI system** that:

- Automates performance evaluation using **pose estimation (MediaPipe)**  
- Ensures **consistent and unbiased scoring**  
- Enables **nationwide participation using smartphones**  
- Stores structured data for **analytics and ranking systems**  

---

## 🧠 Core AI Capabilities

### 🎥 Computer Vision Pipeline
- Real-time **33-point body landmark detection** using MediaPipe  
- Frame-by-frame biomechanical analysis  
- Movement tracking with noise filtering and normalization  

### ⚙️ Test-Specific Analysis Modules
- Push-ups & Sit-ups → Rep counting via joint angle state machines  
- Sprint & Shuttle Run → Velocity and direction tracking  
- Vertical Jump → Height estimation using body normalization  
- Endurance → Fatigue detection via temporal analysis  

### 📊 Scoring System
- Multi-factor weighted scoring (form, stamina, speed, consistency)  
- Transparent explanation for each score  
- Standardized evaluation across all users  

---

## 🚀 Key Features

- 🎯 AI-based video analysis with detailed feedback  
- 🏆 National leaderboard for talent ranking  
- 📊 Performance dashboard with analytics (charts, comparisons)  
- 🧑‍🤝‍🧑 Community feed for athlete engagement  
- 🔐 Secure authentication and role-based access  
- 📦 Media delivery via CDN with signed URLs  


---

## ⚙️ Architecture Highlights

- Microservice-based design separating ML workloads  
- Python ML service containerized using Docker  
- Asynchronous video processing pipeline  
- Secure inter-service communication using internal API secrets  
- Scalable deployment across cloud infrastructure  

---

## 🔁 Request Flow

1. User uploads video via frontend  
2. Backend forwards video to ML service  
3. ML service performs frame-wise analysis  
4. Annotated video + score returned  
5. Data stored in MongoDB  
6. Media uploaded to CDN  
7. Results displayed on dashboard  

---

## 🧪 Tech Stack

### Frontend
- React.js  
- Tailwind CSS  
- Axios  
- Recharts  

### Backend
- Node.js  
- Express.js  
- JWT Authentication  
- Multer  

### Machine Learning
- Python  
- FastAPI  
- MediaPipe (Pose Estimation)  
- OpenCV  
- NumPy  

### Infrastructure
- MongoDB Atlas  
- ImageKit CDN  
- Vercel (Frontend Hosting)  
- Render (Backend + ML Service)  
- Docker (ML Service Containerization)  

---

## 📊 Data & Analytics

- Structured submission storage  
- Score breakdown with detailed metrics  
- Velocity profiles and comparative analytics  
- Leaderboard aggregation using MongoDB pipelines  

---

## 🔐 Security

- bcrypt password hashing  
- JWT-based authentication  
- Role-based access control  
- Signed CDN URLs for secure media access  
- Internal API validation between services  

---

## 🌍 Impact

- Eliminates geographic barriers in talent discovery  
- Provides equal opportunity for rural athletes  
- Reduces dependency on expensive infrastructure  
- Enables large-scale, data-driven scouting  

---

## 🔥 Engineering Highlights

- Designed a **scalable AI microservices architecture**  
- Implemented **real-time pose estimation pipeline**  
- Built **custom scoring algorithms for multiple athletic tests**  
- Optimized system for **low-cost, high-scale deployment**  
- Delivered a **production-ready AI platform**  

---

## 🚀 Future Scope

- Custom ML model trained on regional athlete data  
- Native mobile application  
- Integration with national sports authorities  
- Advanced analytics and coaching insights  
- Real-time performance tracking  

---

<h2 align="center">Manu Saviour</h2> <p align="center"> <b>Full Stack Developer • Machine Learning Engineer • DevOps Practitioner • Data Science Enthusiast</b> </p> <p align="center"> Building scalable web applications • Designing AI-driven solutions • Engineering production-ready systems </p> <p align="center"> <img src="https://img.shields.io/badge/Full%20Stack-Developer-blue?style=for-the-badge" /> <img src="https://img.shields.io/badge/Machine%20Learning-AI-green?style=for-the-badge" /> <img src="https://img.shields.io/badge/DevOps-Cloud-orange?style=for-the-badge" /> <img src="https://img.shields.io/badge/Data%20Science-Analytics-purple?style=for-the-badge" /> </p>
