/* eslint-disable @typescript-eslint/no-explicit-any */
import ejs from 'ejs'
import status from 'http-status'
import nodemailer from 'nodemailer'
import path from 'path'
import config from '../config'
import ApiError from '../errors/apiError'
import { logger } from './logger/logger'

const transporter = nodemailer.createTransport({
  host: config.emailSender.smtp_host,
  secure: true,
  auth: {
    user: config.emailSender.email,
    pass: config.emailSender.app_pass,
  },
  port: Number(config.emailSender.smtp_port),
})

interface SendEmailOptions {
  to: string
  subject: string
  templateName: string
  templateData: Record<string, any>
  attachments?: {
    filename: string
    content: Buffer | string
    contentType: string
  }[]
}

export const sendEmail = async ({
  subject,
  templateData,
  templateName,
  to,
  attachments,
}: SendEmailOptions) => {
  try {
    const templatePath = path.resolve(
      process.cwd(),
      `src/app/templates/${templateName}.ejs`
    )

    const html = await ejs.renderFile(templatePath, templateData)

    const info = await transporter.sendMail({
      from: config.emailSender.smtp_from,
      to: to,
      subject: subject,
      html: html,
      attachments: attachments?.map(attachment => ({
        filename: attachment.filename,
        content: attachment.content,
        contentType: attachment.contentType,
      })),
    })

    console.log(`Email sent to ${to} : ${info.messageId}`)
    logger.info(`Email sent to ${to} : ${info.messageId}`)
  } catch (error: any) {
    console.log('Email Sending Error', error.message)
    logger.error('Email Sending Error', error.message)
    throw new ApiError(status.INTERNAL_SERVER_ERROR, 'Failed to send email')
  }
}
