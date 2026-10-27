
import bcrypt from "bcrypt";
import {
    createUser,
    findUserByEmail,
    type ChatUser,
} from "../db/auth.repository.js";
import type { RegisterInput, LoginInput } from "../schemas/auth.schema.js";
import { AppError } from "../utils/AppError.js";



const bcrypt_length = 12;
const Max_bcrypt_bytes = 72;

export async function registerUser(
    input: RegisterInput
): Promise<ChatUser> {
    const passwordBytes = Buffer.byteLength(input.password, "utf8");

    if (passwordBytes > Max_bcrypt_bytes) {
        throw new AppError(
            "Password must not exceed 72 UTF-8 bytes",
            400,
            "PASSWORD_TOO_LONG"
        );
    }

    const passwordHash = await bcrypt.hash(
        input.password,
        bcrypt_length
    );

    try {
        return await createUser({
            username: input.username,
            email: input.email,
            passwordHash,
        });
    } catch (error: unknown) {
        if (
            typeof error === "object" &&
            error !== null &&
            "code" in error &&
            error.code === "23505"
        ) {
            throw new AppError(
                "Username or email is already registered",
                409,
                "ACCOUNT_ALREADY_EXISTS"
            );
        }

        throw error;
    }
}


export async function loginUser(
    input: LoginInput
): Promise<ChatUser> {
    const user = await findUserByEmail(input.email);

    if (!user) {
        throw new AppError(
            "Invalid email or password",
            401,
            "INVALID_CREDENTIALS"
        );
    }

    const passwordMatches = await bcrypt.compare(
        input.password,
        user.password_hash
    );

    if (!passwordMatches) {
        throw new AppError(
            "Invalid email or password",
            401,
            "INVALID_CREDENTIALS"
        );
    }

    const { password_hash: _passwordHash, ...safeUser } = user;

    return safeUser;
}