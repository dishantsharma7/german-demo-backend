// // import { Request, Response, NextFunction } from "express";
// // import jwt from "jsonwebtoken";

// // const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey";

// // export interface AuthRequest extends Request {
// //   userId?: string;
// //   role?: string;
// // }

// // export const authenticate = (
// //   req: AuthRequest,
// //   res: Response,
// //   next: NextFunction
// // ) => {
// //   const authHeader = req.headers.authorization;
// //   if (!authHeader || !authHeader.startsWith("Bearer ")) {
// //     return res.status(401).json({ message: "No token provided." });
// //   }
// //   const token = authHeader.split(" ")[1];
// //   try {
// //     const decoded = jwt.verify(token, JWT_SECRET) as {
// //       userId: string;
// //       role: string;
// //     };
// //     req.userId = decoded.userId;
// //     req.role = decoded.role;
// //     next();
// //   } catch (error) {
// //     return res.status(401).json({ message: "Invalid or expired token." });
// //   }
// // };

// import { Request, Response, NextFunction } from "express";
// import jwt, { JwtPayload } from "jsonwebtoken";
// import dotenv from "dotenv";

// // interface TokenPayload extends JwtPayload {
// //   userId: string;
// //   role: string;
// // }

// export const authenticate = (
//   req: Request,
//   res: Response,
//   next: NextFunction
// ) => {
//   const token = req.cookies?.user_token; // 👈 read from cookies

//   console.log("TOKEN", token);

//   if (!token) {
//     return res.status(401).json({ message: "No authentication token found." });
//   }
//   const secret = process.env.JWT_SECRET;
//   if (!secret) {
//     return res.status(500).json({ message: "Server configuration error." });
//   }

//   try {
//     const decoded = jwt.verify(token, secret) as JwtPayload | string;

//     if (
//       typeof decoded === "string" ||
//       !decoded ||
//       !("userId" in decoded) ||
//       !("role" in decoded)
//     ) {
//       return res.status(401).json({ message: "Invalid token payload." });
//     }

//     // const { userId, role } = decoded as TokenPayload;
//     // req.userId = userId;
//     // req.role = role;

//     next();
//   } catch (error) {
//     return res.status(401).json({ message: "Invalid or expired token." });
//   }
// };

import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { UserRole } from "../models/enums";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

interface JwtPayload {
  userId: string;
  role: UserRole;
}

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      userId?: string;
      userRole?: UserRole;
    }
  }
}

// Verify JWT Token
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get token from cookies
    console.log("TEST", req.cookies);

    const token = req.cookies?.token;

    if (!token) {
      res
        .status(401)
        .json({ success: false, message: "Authentication required" });
      return;
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;

    // Attach user info to request
    req.userId = decoded.userId;
    req.userRole = decoded.role;

    next();
  } catch (error: any) {
    console.error("Authentication error:", error);

    if (error.name === "JsonWebTokenError") {
      res.status(401).json({ success: false, message: "Invalid token" });
      return;
    }

    if (error.name === "TokenExpiredError") {
      res.status(401).json({ success: false, message: "Token expired" });
      return;
    }

    res.status(500).json({ success: false, message: "Authentication failed" });
  }
};

// Authorize specific roles
export const authorize = (...allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.userRole) {
      res
        .status(401)
        .json({ success: false, message: "Authentication required" });
      return;
    }

    if (!allowedRoles.includes(req.userRole)) {
      res.status(403).json({
        success: false,
        message: "You do not have permission to perform this action",
      });
      return;
    }

    next();
  };
};

// Optional authentication (doesn't fail if no token)
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = req.cookies.token;

    if (token) {
      const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
      req.userId = decoded.userId;
      req.userRole = decoded.role;
    }

    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
};
