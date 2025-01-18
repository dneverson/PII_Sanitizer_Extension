# SafeType Guard: Automatic PII Sanitization

Are you worried that you, your coworkers, or your employees might accidentally expose sensitive information online? With the increasing use of AI language models and web applications, a single accidental paste could expose Social Security numbers, credit card details, or company secrets to the world.

This Chrome extension automatically sanitizes sensitive data as you type, protecting Personal Identifiable Information (PII) before it reaches forms, chat applications, or AI models.


## 🛡️ Features

- Automatic PII Detection & Sanitization
- Local Processing (No Data Transmission)
- Customizable Site Permissions
- Real-time Protection

## 🔒 Protected Information Types

| Type | Example Input | Sanitized Output |
|------|--------------|------------------|
| Social Security Numbers | 123-45-6789 | XXX-XX-XXXX |
| Credit Card Numbers | 4111111111111111 | ************1234 |
| API/Auth Tokens | bearer ak_12345token | API_TOKEN_REMOVED |
| AWS Access Keys | AKIAIOSFODNN7EXAMPLE | AWS_KEY_REMOVED |
| Email Addresses | user@example.com | email@domain.com |
| Phone Numbers | (555) 123-4567 | (XXX) XXX-XXXX |
| MAC Addresses | 00:1A:2B:3C:4D:5E | XX:XX:XX:XX:XX:XX |
| IPv4 Addresses | 192.168.1.1 | XXX.XXX.XXX.XXX |
| Full Names | John Smith | John Doe |

## 🚀 Installation

1. Install from Chrome Web Store
2. Click the SafeType Guard icon
3. Grant permissions for sites you want to protect
4. Start typing with confidence

## 🔐 Privacy & Security

- All processing happens locally in your browser
- No data storage or transmission
- Site-specific permissions model
- Open source for transparency

## 🛠️ Development

```bash
# Clone repository
git clone https://github.com/dneverson/PII_Sanitizer_Extension

# Install dependencies
npm install

# Build extension
npm run build

# Run tests
npm test
```

## 🤝 Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🌟 Support

If you found this project useful, please consider giving it a star on GitHub, sharing it with others, and or donating [PayPal Donation Page](https://www.paypal.com/donate/?hosted_button_id=TPHPL2ZYZA2JL)

## 📧 Contact

For support or queries, please open an issue
---
Made with ❤️ for privacy
