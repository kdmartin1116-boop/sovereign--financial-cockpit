# Sovereign Financial Cockpit

## **Disclaimer**

**This repository is for educational and informational purposes only. The information provided here does not constitute legal or financial advice. We strongly recommend that you consult with a qualified professional to discuss your specific situation and to ensure you are in compliance with all applicable laws and regulations.**

## **Project Goal**

This project aims to provide a financial cockpit to help users manage their finances.

## **Getting Started**

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/kdmartin-boop/sovereign-financial-cockpit.git
    cd sovereign-financial-cockpit
    ```

2.  **Set up the Backend:**
    Install the required Python packages using `pip`:
    ```bash
    pip install -r requirements.txt
    ```

3.  **Set up the Frontend:**
    Install the required Node.js packages using `npm`:
    ```bash
    npm install
    ```

4.  **Create the `uploads` directory:**
    The application requires an `uploads` directory to store uploaded files. Create it if it doesn't exist:
    ```bash
    mkdir uploads
    ```

## **Running the Application**

This project has a separate backend and frontend.

1.  **Run the Backend:**
    Execute the `app.py` script:
    ```bash
    python app.py
    ```
    The backend server will start on `http://127.0.0.1:8001`.

2.  **Run the Frontend:**
    Start the Vite development server:
    ```bash
    npm run dev
    ```
    The frontend application will be available at `http://localhost:5173`. Open this URL in your browser.

## **Contributing**

We welcome contributions to this project. Please read our `CODE_OF_CONDUCT.md` before contributing.