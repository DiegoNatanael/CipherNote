# 🔒 CipherNote

*A secure and private mobile note-taking application built with React Native, ensuring your sensitive thoughts remain encrypted on your device.*

<br>

![React Native](https://img.shields.io/badge/react_native-%2320232a.svg?style=for-the-badge&logo=react-native&logoColor=%2361DAFB)
![Expo](https://img.shields.io/badge/Expo-1B232A?style=for-the-badge&logo=expo&logoColor=white)
![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)
![CryptoJS](https://img.shields.io/badge/CryptoJS-66CCFF?style=for-the-badge&logo=javascript&logoColor=white)
<br>

<p align="center">
  <img src="demo.gif" alt="CipherNote Demo" width="80%">
</p>

## 📖 About The Project

CipherNote is a mobile application designed for personal privacy, allowing users to securely store their notes. Unlike cloud-based note apps, CipherNote encrypts all your content directly on your device, ensuring that your private information remains yours. The app is built with a strong focus on cryptographic principles to provide a robust layer of security.

Every note is encrypted using a powerful encryption key derived from your master password, which you set upon first use. This project serves as a demonstration of secure local data storage and cryptographic implementation in a React Native environment.

> **Note:** While great care has been taken to implement strong cryptographic practices, this project is primarily for educational and portfolio purposes. Always consult with security experts for production-grade applications handling highly sensitive data.

---

## ✨ Key Features

* **Master Password Protection:** Securely set and use a master password to access and decrypt your notes.
* **On-Device Encryption:** All note content is encrypted and stored locally on your device.
* **Auto-Save:** Notes are automatically saved as you type and when navigating away, ensuring no data loss.
* **Secure Key Derivation:** Employs industry-standard algorithms to derive a robust encryption key from your master password without storing the key itself.
* **User-Specific Salt:** A unique cryptographic salt is securely generated and stored for each user, enhancing password security.
* **Intuitive Interface:** Simple and clean design for easy note creation, viewing, and deletion.

---

## 🔐 Security & Cryptography Explained

CipherNote implements a multi-layered approach to protect your notes:

1.  **Master Password:** Your initial line of defense. This password is never stored directly.
2.  **Salt Generation:** Upon setting your master password, a unique, randomly generated cryptographic **salt** is created and securely stored using `expo-secure-store`. This salt ensures that even if two users have the same master password, their derived keys (and thus encrypted data) will be completely different.
3.  **Key Derivation (PBKDF2):** When you log in, your master password and the stored salt are fed into **PBKDF2 (Password-Based Key Derivation Function 2)** with a high number of iterations. This computationally intensive process generates a strong, consistent **encryption key**. The key is held only in memory for the session and is never written to disk.
4.  **Data Encryption (AES-256):** Each note's content is encrypted using **AES-256 GCM (Advanced Encryption Standard with Galois/Counter Mode)**, a robust symmetric encryption algorithm.
    * A **unique Initialization Vector (IV)** is generated for *each* encryption operation, ensuring that identical plaintext does not result in identical ciphertext. This IV is stored alongside the encrypted data.
    * The encrypted content (ciphertext) and its unique IV are then saved to a file specific to that note.
5.  **Data Decryption:** To read a note, the encryption key is re-derived using your password and salt. This key, along with the stored IV and ciphertext, is used to decrypt the note content back into plaintext for display.

This design ensures that without your master password, it is practically impossible to decrypt your notes, even if someone gains access to your device's file system.

---

## 🛠️ Built With

This project leverages the power of React Native and the Expo framework for cross-platform mobile development, along with specialized libraries for security:

* **React Native:** A framework for building native mobile apps using JavaScript/TypeScript.
* **Expo:** A set of tools and services built on top of React Native that makes development faster and easier.
* **TypeScript:** A strongly typed superset of JavaScript that enhances code quality and maintainability.
* **@react-navigation/native & @react-navigation/stack:** For seamless screen transitions and application flow.
* **expo-secure-store:** Securely stores sensitive string values on the device (used for master password salt and test data).
* **expo-file-system:** For reading and writing encrypted note files locally.
* **expo-crypto:** Provides secure cryptographic primitives and random number generation, used for IVs and salts.
* **CryptoJS:** A collection of JavaScript cryptographic algorithms (used for AES-256 GCM and PBKDF2 implementation).
* **react-native-get-random-values:** Provides a cryptographically strong random number generator needed by CryptoJS.
* **@expo/vector-icons:** For easily using popular icon sets like Ionicons.

---

## 🏁 Getting Started

To get a local copy of CipherNote up and running on your development machine, follow these steps.

### Prerequisites

* Node.js (LTS version recommended)
* npm or Yarn
* Expo Go app on your mobile device (iOS or Android) or a mobile emulator/simulator installed.

### Installation

1.  Clone the repository:
    ```sh
    git clone https://github.com/DiegoNatanael/CipherNote
    ```
2.  Navigate into the project directory:
    ```sh
    cd CipherNote
    ```
3.  Install project dependencies:
    ```sh
    npm install
    # or
    # yarn install
    ```
4.  Start the Expo development server:
    ```sh
    npx expo start
    ```
5.  Scan the QR code displayed in your terminal (or browser) with the Expo Go app on your device, or choose to run on a simulator/emulator.

---

## Usage

1.  **Set Master Password:** On first launch, you will be prompted to set a master password. Choose a strong, memorable password.
2.  **Login:** Use your master password to unlock the app and access your notes.
3.  **Create New Note:** Tap the `+` floating action button on the Home screen.
4.  **Type & Auto-Save:** Write your note. It will automatically save as you type and when you navigate back to the Home screen.
5.  **View/Edit Note:** Tap on any note in the list to open and edit it.
6.  **Delete Note:** While viewing/editing a note, tap the trash icon in the header to delete it. On the Home screen, you can also swipe left (or long-press, depending on implementation) on a note and tap the delete button.
7.  **Clear All Data:** Use the "Clear All Data" button on the Home screen (the alert icon) to permanently delete your master password and all encrypted notes from your device. Use with extreme caution!

---

## 📜 License

All Rights Reserved. © 2025 Diego Natanael Gonzalez Esparza

Permission to use, copy, modify, and/or distribute this software for any purpose with or without fee is hereby denied.

---

## 📬 Contact
<!--
Diego Natanael - [Your Portfolio Website Link] - [your.email@example.com]
-->
Project Link: [https://github.com/DiegoNatanael/CipherNote](https://github.com/DiegoNatanael/ciphernote)
<br>
