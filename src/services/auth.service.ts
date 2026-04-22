import { prisma } from '../config/database';
import { hashPassword, comparePassword } from '../helpers/hash.helper';
import { generateTokenPair } from '../helpers/jwt.helper';
import { RegisterInput, LoginInput } from '../validators/auth.validator';

export class AuthService {
  static async register(data: RegisterInput) {
    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw { statusCode: 409, message: 'Email sudah terdaftar' };
    }

    // Hash password
    const passwordHash = await hashPassword(data.password);

    // Create user
    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        passwordHash,
        university: data.university,
        monthlyAllowance: data.monthlyAllowance,
      },
      select: {
        id: true,
        name: true,
        email: true,
        university: true,
        role: true,
        createdAt: true,
      },
    });

    // Generate tokens
    const tokens = generateTokenPair({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return { user, ...tokens };
  }

  static async login(data: LoginInput) {
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user || !user.passwordHash) {
      throw { statusCode: 401, message: 'Email atau password salah' };
    }

    // Verify password
    const isPasswordValid = await comparePassword(data.password, user.passwordHash);

    if (!isPasswordValid) {
      throw { statusCode: 401, message: 'Email atau password salah' };
    }

    // Generate tokens
    const tokens = generateTokenPair({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        university: user.university,
        avatarUrl: user.avatarUrl,
        role: user.role,
      },
      ...tokens,
    };
  }

  static async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        university: true,
        monthlyAllowance: true,
        avatarUrl: true,
        role: true,
        provider: true,
        preferredCurrency: true,
        notifBudgetAlert: true,
        notifWeeklyReport: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw { statusCode: 404, message: 'User tidak ditemukan' };
    }

    return user;
  }
  static async handleOAuthLogin(profile: any) {
    const email = profile.emails?.[0]?.value;
    if (!email) {
      throw { statusCode: 400, message: 'Email tidak ditemukan dari akun Google' };
    }

    const avatarUrl = profile._json?.picture || profile.photos?.[0]?.value || null;

    let user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Create new user via OAuth
      user = await prisma.user.create({
        data: {
          name: profile.displayName || 'Sobat Cuan',
          email,
          provider: 'GOOGLE',
          providerAccountId: profile.id,
          avatarUrl,
        },
      });
    } else {
      // If user exists but logs in via Google, we can link the provider info
      if (user.provider !== 'GOOGLE' || user.providerAccountId !== profile.id || !user.avatarUrl) {
        user = await prisma.user.update({
          where: { email },
          data: {
            provider: 'GOOGLE',
            providerAccountId: profile.id,
            avatarUrl: user.avatarUrl || avatarUrl,
          },
        });
      }
    }

    const tokens = generateTokenPair({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return { user, ...tokens };
  }
}
