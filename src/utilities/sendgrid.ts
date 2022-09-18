/* eslint-disable @typescript-eslint/no-explicit-any */
import sgMail from '@sendgrid/mail';
import { SENDGRID_API_KEY } from '../config';

require('isomorphic-fetch');

sgMail.setApiKey(SENDGRID_API_KEY);

class Sendgrid {
  sender = sgMail;

  post(message: any, subject: string) {
    const msg = {
      to: 'hello@rocco.me', // Change to your recipient
      from: 'hello@altcash.co.za', // Change to your verified sender
      subject: subject,
      text: message,
      html: `<h3>New Message!</h3><br /><div>${message}</div>`,
    };

    return this.sender.send(msg);
  }
}

export default Sendgrid;
