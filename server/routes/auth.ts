import { RequestHandler } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { LoginRequest, SignupRequest, AuthResponse, User } from "@shared/api";

// In production, this would be a proper database
const users: User[] = [];
const JWT_SECRET = "weekend-wanderer-secret"; // In production, use env variable

// Helper function to generate JWT token
const generateToken = (userId: string): string => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: "7d" });
};

// Helper function to find user by email
const findUserByEmail = (email: string): User | undefined => {
  return users.find(user => user.email === email);
};

export const handleSignup: RequestHandler = async (req, res) => {
  try {
    const { name, email, password }: SignupRequest = req.body;

    // Validate input
    if (!name || !email || !password) {
      const response: AuthResponse = {
        success: false,
        message: "All fields are required"
      };
      return res.status(400).json(response);
    }

    // Check if user already exists
    if (findUserByEmail(email)) {
      const response: AuthResponse = {
        success: false,
        message: "User with this email already exists"
      };
      return res.status(409).json(response);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create new user
    const newUser: User = {
      id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      email,
      createdAt: new Date().toISOString()
    };

    // Store user (with hashed password)
    users.push({
      ...newUser,
      password: hashedPassword
    } as any);

    // Generate token
    const token = generateToken(newUser.id);

    const response: AuthResponse = {
      success: true,
      user: newUser,
      token,
      message: "Account created successfully"
    };

    res.status(201).json(response);
  } catch (error) {
    console.error("Signup error:", error);
    const response: AuthResponse = {
      success: false,
      message: "Internal server error"
    };
    res.status(500).json(response);
  }
};

export const handleLogin: RequestHandler = async (req, res) => {
  try {
    const { email, password }: LoginRequest = req.body;

    // Validate input
    if (!email || !password) {
      const response: AuthResponse = {
        success: false,
        message: "Email and password are required"
      };
      return res.status(400).json(response);
    }

    // Find user
    const userWithPassword = users.find(user => user.email === email) as any;
    if (!userWithPassword) {
      const response: AuthResponse = {
        success: false,
        message: "Invalid email or password"
      };
      return res.status(401).json(response);
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, userWithPassword.password);
    if (!isValidPassword) {
      const response: AuthResponse = {
        success: false,
        message: "Invalid email or password"
      };
      return res.status(401).json(response);
    }

    // Remove password from user object
    const { password: _, ...user } = userWithPassword;

    // Generate token
    const token = generateToken(user.id);

    const response: AuthResponse = {
      success: true,
      user: user as User,
      token,
      message: "Login successful"
    };

    res.json(response);
  } catch (error) {
    console.error("Login error:", error);
    const response: AuthResponse = {
      success: false,
      message: "Internal server error"
    };
    res.status(500).json(response);
  }
};

// Middleware to verify JWT token
export const verifyToken: RequestHandler = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ success: false, message: "Access token required" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    (req as any).userId = decoded.userId;
    next();
  } catch (error) {
    return res.status(403).json({ success: false, message: "Invalid token" });
  }
};

export const handleMe: RequestHandler = (req, res) => {
  try {
    const userId = (req as any).userId;
    const user = users.find(u => u.id === userId);
    
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const { password: _, ...userWithoutPassword } = user as any;
    res.json({ success: true, user: userWithoutPassword });
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};
