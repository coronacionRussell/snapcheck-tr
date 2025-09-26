# Firebase Studio

This is a NextJS starter in Firebase Studio.

To get started, take a look at src/app/page.tsx.

## Running Locally

To run this project on your local machine, follow these steps:

### 1. Set up Environment Variables

You need to provide your Firebase and Google AI credentials.

1.  Make a copy of the `.env.example` file and rename it to `.env`.
2.  Open your new `.env` file.
3.  Fill in the values for your Firebase project. You can find these in the Firebase console: Go to **Project settings** > **General** > **Your apps** > **SDK setup and configuration**.
4.  Add your Google AI API key for Gemini. You can get one from [Google AI Studio](https://aistudio.google.com/app/apikey).
5.  Add your OpenAI API key. You can get one from the [OpenAI Platform](https://platform.openai.com/api-keys).

Your `.env` file should look like this:

```
NEXT_PUBLIC_FIREBASE_API_KEY="AIza..."
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="your-project-id.firebaseapp.com"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="your-project-id"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="your-project-id.appspot.com"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="..."
NEXT_PUBLIC_FIREBASE_APP_ID="1:..."
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID="G-..."

# Get your key from https://aistudio.google.com/app/apikey
GEMINI_API_KEY="your-gemini-api-key"

# Get your key from https://platform.openai.com/api-keys
OPENAI_API_KEY="your-openai-api-key"
```

### 2. Install Dependencies

Open your terminal, navigate to the project directory, and run:

```bash
npm install
```

### 3. Run the Development Servers

This project requires two development servers to run simultaneously: one for the Next.js frontend and another for the Genkit AI flows.

1.  **Terminal 1: Start the Next.js app**
    ```bash
    npm run dev
    ```
    Your application will be available at [http://localhost:3000](http://localhost:3000).

2.  **Terminal 2: Start the Genkit AI server**
    ```bash
    npm run genkit:watch
    ```
    This will start the Genkit development server and automatically restart it when you make changes to your AI flows. The AI features of the app will not work without this server running.

## Cost to Publish

This application is built to be very cost-effective and can likely be run for **free** under the standard free tiers of its core services.

*   **Firebase**: The project uses Firebase for hosting, database (Firestore), user authentication, and file storage. The Firebase "Spark Plan" (free tier) is generous and should cover the needs of a small-to-medium user base without any cost. You would only incur costs if the app's usage significantly exceeds the free limits.
*   **Google AI (Gemini)**: The AI features are powered by the Google Gemini API. This also has a substantial free tier with a high number of requests per minute. For a typical school or classroom use case, it is unlikely you will exceed these limits.
*   **OpenAI**: If you integrate OpenAI, you will be subject to their pricing. They also have a free tier that you can use to get started.

In summary, you can publish and run this application without expecting to pay anything until it reaches a very large scale.
