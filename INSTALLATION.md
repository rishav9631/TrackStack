# Installation & Deployment Guide

This guide details how to deploy the **StackTrack** application. The backend will be hosted on **Render**, and the frontend will be hosted on **Vercel**.

## Prerequisites

- A [GitHub](https://github.com/) account with the repository pushed.
- A [Render](https://render.com/) account.
- A [Vercel](https://vercel.com/) account.
- A [MongoDB Atlas](https://www.mongodb.com/atlas/database) connection string.
- [Google Cloud Console](https://console.cloud.google.com/) credentials (Client ID).
- Email service credentials (e.g., Gmail App Password).

---

## Part 1: Backend Deployment (Render)

Deploy the backend first, as you will need the backend URL for the frontend configuration.

1.  **Log in to Render** and go to your **Dashboard**.
2.  Click **New +** and select **Web Service**.
3.  Connect your GitHub account and select the **TrackStack** repository.
4.  Configure the service with the following details:
    *   **Name:** `stacktrack-backend` (or any name you prefer)
    *   **Region:** Select the one closest to you (e.g., Singapore, Frankfurt).
    *   **Branch:** `main`
    *   **Root Directory:** `server` (Important: The backend code is in the `server` folder).
    *   **Runtime:** `Node`
    *   **Build Command:** `npm install`
    *   **Start Command:** `node index.js`
    *   **Instance Type:** Free (for hobby projects).

5.  **Environment Variables:**
    Scroll down to the **Environment Variables** section and add the following keys and values.

    | Key | Value Description |
    | :--- | :--- |
    | `PORT` | `5000` (or leave default, Render assigns one automatically) |
    | `MONGO_URI` | Your MongoDB connection string (e.g., `mongodb+srv://...`) |
    | `JWT_SECRET` | A strong secret key for JWT authentication. |
    | `MAIL_HOST` | SMTP Host (e.g., `smtp.gmail.com`) |
    | `MAIL_USER` | Your email address for sending mails. |
    | `MAIL_PASS` | Your email app password (not your login password). |
    | `GOOGLE_CLIENT_ID` | Your Google OAuth Client ID. |
    | `REACT_APP_BASE_URL` | The URL where your **Frontend** will be hosted (e.g., `https://stacktrack.vercel.app`). You can update this *after* deploying the frontend. |
    | `SPLITWISE_REDIRECT_URI` | `https://<YOUR-FRONTEND-URL>/callback` (Update after frontend deployment). |

6.  Click **Create Web Service**.
7.  Wait for the deployment to finish. Once live, copy the **onrender.com** URL (e.g., `https://stacktrack-backend.onrender.com`). You will need this for the frontend.

---

## Part 2: Frontend Deployment (Vercel)

1.  **Log in to Vercel** and go to your **Dashboard**.
2.  Click **Add New...** -> **Project**.
3.  Import the **TrackStack** repository from GitHub.
4.  Configure the project:
    *   **Framework Preset:** Create React App (should be detected automatically).
    *   **Root Directory:** `./` (Leave as default, or select the root if asked).
    *   **Build Command:** `npm run build`
    *   **Output Directory:** `build`

5.  **Environment Variables:**
    Expand the **Environment Variables** section and add the following:

    | Key | Value Description |
    | :--- | :--- |
    | `REACT_APP_BASE_URL` | The **Backend URL** you just copied from Render (e.g., `https://stacktrack-backend.onrender.com`). **Do not add a trailing slash.** |
    | `REACT_APP_GOOGLE_CLIENT_ID` | Your Google OAuth Client ID (same as backend). |

6.  Click **Deploy**.
7.  Wait for the build to complete. Vercel will provide you with a deployment URL (e.g., `https://stacktrack.vercel.app`).

---

## Part 3: Final Configuration

1.  **Update Backend Environment Variables:**
    *   Go back to your **Render Dashboard** -> **Settings** -> **Environment Variables**.
    *   Update `REACT_APP_BASE_URL` to your new **Vercel Frontend URL** (e.g., `https://stacktrack.vercel.app`).
    *   Update `SPLITWISE_REDIRECT_URI` to `https://stacktrack.vercel.app/callback`.
    *   **Save Changes**. Render will automatically redeploy the backend.

2.  **Update Google Cloud Console:**
    *   Go to your Google Cloud Console credentials.
    *   Add your Vercel URL to **Authorized JavaScript origins**.
    *   Add `https://stacktrack.vercel.app` (and `https://stacktrack.vercel.app/auth/google/callback` if needed) to **Authorized redirect URIs**.

3.  **Test the Application:**
    *   Open your Vercel URL.
    *   Try logging in and using the features to ensure everything is connected correctly.
