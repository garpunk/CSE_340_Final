import bcrypt from "bcrypt";
import db from "./db.js";

/**
 * Find a user by email (case-insensitive). Returns id, name, email, role, password_hash.
 */
const findUserByEmail = async (email) => {
  const result = await db.query(
    `SELECT id, name, email, role, password_hash
     FROM users
     WHERE LOWER(email) = LOWER($1)
     LIMIT 1`,
    [email]
  );
  return result.rows[0] ?? null;
};

/**
 * Verify plain password against stored bcrypt hash.
 */
const verifyPassword = async (plainPassword, hashedPassword) => {
  return bcrypt.compare(plainPassword, hashedPassword);
};

/**
 * Create a new user with hashed password. Default role is "user".
 */
const createUser = async ({ name, email, password, role = "user" }) => {
  const password_hash = await bcrypt.hash(password, 10);
  const result = await db.query(
    `INSERT INTO users (name, email, password_hash, role)
     VALUES ($1, $2, $3, $4)
     RETURNING id, name, email, role, created_at`,
    [name.trim(), email.trim().toLowerCase(), password_hash, role]
  );
  return result.rows[0];
};

/**
 * Check if email is already registered.
 */
const emailExists = async (email) => {
  const result = await db.query(
    `SELECT 1 FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1`,
    [email]
  );
  return result.rowCount > 0;
};

/**
 * All users for admin UI (no password hash).
 */
const listUsers = async () => {
  const result = await db.query(
    `SELECT id, name, email, role, created_at
     FROM users
     ORDER BY id ASC`
  );
  return result.rows;
};

/**
 * Public profile fields by id (no password hash).
 */
const findUserById = async (id) => {
  const result = await db.query(
    `SELECT id, name, email, role, created_at
     FROM users
     WHERE id = $1
     LIMIT 1`,
    [id]
  );
  return result.rows[0] ?? null;
};

/**
 * Count users with a given role (e.g. enforce at least one admin).
 */
const countUsersWithRole = async (role) => {
  const result = await db.query(
    `SELECT COUNT(*)::int AS n FROM users WHERE role = $1`,
    [role]
  );
  return result.rows[0]?.n ?? 0;
};

/**
 * Update role; returns updated row or null if id missing.
 */
const updateUserRole = async (id, role) => {
  const result = await db.query(
    `UPDATE users SET role = $2 WHERE id = $1
     RETURNING id, name, email, role, created_at`,
    [id, role]
  );
  return result.rows[0] ?? null;
};

export {
  createUser,
  countUsersWithRole,
  emailExists,
  findUserByEmail,
  findUserById,
  listUsers,
  updateUserRole,
  verifyPassword,
};
