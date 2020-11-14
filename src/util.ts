import { v4 as uuid } from 'uuid'

export function getUuid (): string {
  const id = uuid()
  return id.replace(/-/g, '')
}

export class StatusError extends Error {
  public code: number

  constructor (message: string, statusCode: number) {
    super(message)
    this.code = statusCode
  }
}