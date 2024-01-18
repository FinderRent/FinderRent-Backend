const nodemailer = require("nodemailer");
const pug = require("pug");
const { convert } = require("html-to-text");

module.exports = class Email {
  constructor(options) {
    if (options.user) {
      const { user, OTP } = options;
      this.to = user.email;
      this.firstName = user.firstName;
      this.OTP = OTP;
      this.from = `FinderRent<${process.env.EMAIL_FROM}>`;
    } else {
      const { firstName, lastName, email, subject, message } = options;
      this.to = "maorsa9@gmail.com";
      this.firstName = firstName;
      this.lastName = lastName;
      this.from = email;
      this.subject = subject;
      this.message = message;
    }
  }

  newTransport() {
    if (process.env.NODE_ENV === "production") {
      // Sendgrid
      return nodemailer.createTransport({
        service: "SendGrid",
        auth: {
          user: process.env.SENDGRID_USERNAME,
          pass: process.env.SENDGRID_PASSWORD,
        },
      });
    } else {
      return nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        auth: {
          user: process.env.EMAIL_USERNAME,
          pass: process.env.EMAIL_PASSWORD,
        },
      });
    }
  }

  async send(template, subject) {
    // 1) Render HTML based on template
    const html = pug.renderFile(`${__dirname}/../views/${template}.pug`, {
      firstName: this.firstName,
      lastName: this.lastName,
      message: this.message,
      OTP: this.OTP,
      subject,
    });

    // 2) Define email options
    const mailOptions = {
      from: this.from,
      to: this.to,
      subject,
      html,
      text: convert(html),
    };

    // 3) create a transport and send email
    await this.newTransport().sendMail(mailOptions);
  }

  async sendWelcome() {
    await this.send("welcomeEmail", "Welcome to the App!");
  }

  async sendPasswordReset() {
    await this.send("resetPasswordEmail", "Your password reset code");
  }

  async contactUs() {
    await this.send("contactUsEmail", this.subject);
  }
};
