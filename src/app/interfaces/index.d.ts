import { JwtPayload } from 'jsonwebtoken'
import { Role } from '../generated/enums'

declare global {
  namespace Express {
    interface Request {
      user: JwtPayload & {
        id: string
        email: string
        role: Role
      }
    }
  }
}
