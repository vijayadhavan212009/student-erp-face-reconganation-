import { Student, Period, SMSTemplateConfig } from '../types/attendance';

export function formatParentAbsentMessage(
  student: Student,
  period: Period,
  dateStr: string,
  config: SMSTemplateConfig
): string {
  const sonOrDaughter = student.gender === 'female' ? 'daughter' : 'son';

  let msg = config.template;
  msg = msg.replace(/{parent_name}/g, student.parentName || 'Parent');
  msg = msg.replace(/{son_or_daughter}/g, sonOrDaughter);
  msg = msg.replace(/{student_name}/g, student.name);
  msg = msg.replace(/{roll_no}/g, student.rollNumber);
  msg = msg.replace(/{period_name}/g, period.name);
  msg = msg.replace(/{time}/g, `${period.startTime} - ${period.endTime}`);
  msg = msg.replace(/{date}/g, dateStr);
  msg = msg.replace(/{department_name}/g, config.departmentName);
  msg = msg.replace(/{college_name}/g, config.collegeName);

  return msg;
}

export function generateWhatsAppLink(phoneNumber: string, message: string): string {
  const cleanNumber = phoneNumber.replace(/[^0-9]/g, '');
  const encodedMsg = encodeURIComponent(message);
  return `https://wa.me/${cleanNumber}?text=${encodedMsg}`;
}

export function generateSmsLink(phoneNumber: string, message: string): string {
  const encodedMsg = encodeURIComponent(message);
  return `sms:${phoneNumber}?body=${encodedMsg}`;
}
