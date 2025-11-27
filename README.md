<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1LrqiPl18VDOenDBsaarRV51oZS7lXOA2

### **How to Run the Project**

Since this is a standard React project structure using ES modules, you can run it using a modern frontend toolchain.

1. **Install Dependencies:**
   Make sure you have node installed.

   

   ```Bash
   npm install react react-dom lucide-react @google/genai tailwindcss
   # You might need a build tool like Vite
   npm install -D vite @vitejs/plugin-react
   ```

2. **Start the Development Server:**

   ```bash
   npx vite
   ```

   Then open the local URL provided (usually http://localhost:5173).

3. **API Key:**
   The AI features require a Gemini API key. Ensure process.env.API_KEY is available or set it in your .env file for the build tool to pick up.
