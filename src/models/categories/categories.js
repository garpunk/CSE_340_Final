import db from "../db.js";

const listCategories = async () => {
  const result = await db.query(
    `SELECT id, name, description
     FROM categories
     ORDER BY name ASC`,
  );
  return result.rows;
};

const getCategoryById = async (id) => {
  const result = await db.query(
    `SELECT id, name, description FROM categories WHERE id = $1`,
    [id],
  );
  return result.rows[0] ?? null;
};

const createCategory = async (name, description) => {
  const result = await db.query(
    `INSERT INTO categories (name, description)
     VALUES ($1, $2)
     RETURNING id, name, description`,
    [name.trim(), description?.trim() || null],
  );
  return result.rows[0];
};

const updateCategory = async (id, name, description) => {
  const result = await db.query(
    `UPDATE categories
     SET name = $2, description = $3
     WHERE id = $1
     RETURNING id, name, description`,
    [id, name.trim(), description?.trim() || null],
  );
  return result.rows[0] ?? null;
};

const deleteCategory = async (id) => {
  const result = await db.query(`DELETE FROM categories WHERE id = $1`, [id]);
  return result.rowCount > 0;
};

const countTicketsInCategory = async (categoryId) => {
  const result = await db.query(
    `SELECT COUNT(*)::int AS n FROM tickets WHERE category_id = $1`,
    [categoryId],
  );
  return result.rows[0]?.n ?? 0;
};

export {
  listCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  countTicketsInCategory,
};
