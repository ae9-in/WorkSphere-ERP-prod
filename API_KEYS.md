# API Keys Configuration Guide

WorkSphere ERP integrates with several third-party services for file storage, payments, location tracking, user authentication, telephony, and AI analytics. Follow these steps to obtain credentials for each API integration.

---

## ☁️ 1. Cloudinary (File Storage)
Cloudinary stores employee profile images, signatures, and PDF document attachments.

1. Go to [Cloudinary Sign Up](https://cloudinary.com/users/register/free).
2. Create a free account.
3. Log in to the Cloudinary Dashboard console.
4. From the **Product Environment Settings** or main header, locate and copy:
   - **Cloud Name** (`CLOUDINARY_CLOUD_NAME`)
   - **API Key** (`CLOUDINARY_API_KEY`)
   - **API Secret** (`CLOUDINARY_API_SECRET`)
5. Update your `.env` variables.

---

## 🔑 2. Google OAuth SSO
Allows employees to log in using Google Identity services.

1. Open the [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new project (e.g., "WorkSphere ERP").
3. Navigate to **APIs & Services** > **OAuth consent screen**.
4. Set User Type to **External**, fill in required support email details, and publish the app to testing/production.
5. Go to **APIs & Services** > **Credentials**.
6. Click **Create Credentials** > **OAuth client ID**.
7. Set Application Type to **Web application**.
8. Under **Authorized redirect URIs**, add your backend SSO callback URL:
   - Development: `http://localhost:5000/api/v1/auth/google/callback`
9. Click Create. Copy:
   - **Client ID** (`GOOGLE_CLIENT_ID`)
   - **Client Secret** (`GOOGLE_CLIENT_SECRET`)

---

## 🤖 3. AI Providers (OpenAI, Gemini, Anthropic, DeepSeek, HuggingFace)
Used for automated candidate screening, leave insights, and smart logistics optimization schedules.

### OpenAI (GPT-4)
1. Go to the [OpenAI Platform](https://platform.openai.com/).
2. Register an account and navigate to the **API keys** tab on the left sidebar.
3. Click **Create new secret key** and copy it (`OPENAI_API_KEY`, `OPENAI_KEY`).
4. Ensure billing features are active with loaded credits.

### Google Gemini
1. Open [Google AI Studio](https://aistudio.google.com/).
2. Log in with your Google account.
3. Click **Get API key** in the top left header.
4. Select **Create API key in new project** and copy it (`GOOGLE_GEMINI_KEY`).

### Anthropic Claude
1. Go to the [Anthropic Console](https://console.anthropic.com/).
2. Navigate to **API Keys**.
3. Generate a key and copy it (`ANTHROPIC_API_KEY`).

### DeepSeek
1. Go to the [DeepSeek Platform](https://platform.deepseek.com/).
2. Navigate to **API Keys** and generate a new secret token (`DEEPSEEK_API_KEY`).

### HuggingFace Models
1. Go to [HuggingFace Settings](https://huggingface.co/settings/tokens).
2. Click **New token**, set role to **Read**, and copy (`HF_API_KEY`).

---

## 💬 4. Telephony & SMS (Twilio & Meta WhatsApp)

### Twilio (SMS Notifications)
1. Register on [Twilio](https://www.twilio.com/).
2. From your Twilio Console Dashboard, look at the **Project Info** widget.
3. Copy the following parameters:
   - **Account SID** (`TWILIO_ACCOUNT_SID`)
   - **Auth Token** (`TWILIO_AUTH_TOKEN`)
4. Buy or lease a virtual SMS-enabled phone number. Copy the sender phone:
   - **Twilio Phone / From Number** (`TWILIO_FROM_NUMBER`, `TWILIO_PHONE`)

### Meta WhatsApp Business
1. Register as a developer on [Meta Developers Portal](https://developers.facebook.com/).
2. Create a Meta Business app, and enable the **WhatsApp** product.
3. From the WhatsApp Getting Started page, copy:
   - **Phone Number ID** (`WHATSAPP_PHONE_NUMBER_ID`)
   - **Permanent Access Token** (`META_ACCESS_TOKEN`)
   - Define a custom verify token under Webhook configuration page (`META_VERIFY_TOKEN`).

---

## 💳 5. Payment Gateways (Stripe & Razorpay)

### Stripe
1. Log in to [Stripe Dashboard](https://dashboard.stripe.com/).
2. Toggle the **Test Mode** switch in the top header.
3. Navigate to **Developers** > **API Keys** and copy:
   - **Secret key** (`STRIPE_SECRET_KEY`)
4. Go to **Developers** > **Webhooks** > click **Add endpoint**. Add your backend listener:
   - URL: `https://api.yourdomain.com/api/v1/payments/stripe/webhook`
5. Copy the **Signing secret** (`STRIPE_WEBHOOK_SECRET`).

### Razorpay
1. Open the [Razorpay Dashboard](https://dashboard.razorpay.com/).
2. Toggle to **Test Mode**.
3. Navigate to **Settings** > **API Keys** > click **Generate Key**.
4. Copy the parameters:
   - **Key ID** (`RAZORPAY_KEY_ID`)
   - **Key Secret** (`RAZORPAY_KEY_SECRET`)

---

## 🗺️ 6. Maps & Geocoding (Google Maps & Mapbox)
Used for dispatch routing optimization logs and live GPS tracking widgets in SCM.

### Google Maps
1. Open the [Google Cloud Console](https://console.cloud.google.com/).
2. Navigate to **APIs & Services** > **Library**.
3. Search and enable **Maps JavaScript API**, **Directions API**, and **Geocoding API**.
4. Go to **APIs & Services** > **Credentials**.
5. Click **Create Credentials** > **API key** and copy it (`GOOGLE_MAPS_API_KEY`, `NEXT_PUBLIC_GOOGLE_MAPS_KEY`).

### Mapbox
1. Go to the [Mapbox Account Console](https://account.mapbox.com/).
2. Copy the default public access token or click **Create a token** (`MAPBOX_TOKEN`).

---

## 🗄️ 7. Cloud Object Storage (AWS S3 & Azure Blob Storage)

### AWS S3
1. Log in to [AWS Console](https://aws.amazon.com/).
2. Open the **IAM** service, create a new User, and attach `AmazonS3FullAccess` policies.
3. Under the user's **Security credentials** tab, click **Create access key**.
4. Copy the generated pair:
   - **Access Key ID** (`AWS_ACCESS_KEY`)
   - **Secret Access Key** (`AWS_SECRET`)
5. Create a bucket in S3 and record its region:
   - **Bucket Name** (`AWS_BUCKET`)
   - **Region** (`AWS_REGION`, e.g., `us-east-1`)

### Azure Storage
1. Go to the [Azure Portal](https://portal.azure.com/).
2. Create a new Storage Account.
3. Go to **Security + networking** > **Access keys**.
4. Copy the **Connection string** (`AZURE_STORAGE`).
