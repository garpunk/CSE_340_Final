import db from "../db.js";

const listCommentsForTicket = async (ticketId) => {
  const result = await db.query(
    `SELECT tc.id, tc.ticket_id, tc.user_id, tc.comment, tc.created_at,
            u.name AS user_name
     FROM ticket_comments tc
     JOIN users u ON u.id = tc.user_id
     WHERE tc.ticket_id = $1
     ORDER BY tc.created_at ASC`,
    [ticketId],
  );
  return result.rows;
};

const createComment = async ({ ticket_id, user_id, comment }) => {
  const result = await db.query(
    `INSERT INTO ticket_comments (ticket_id, user_id, comment)
     VALUES ($1, $2, $3)
     RETURNING id`,
    [ticket_id, user_id, comment.trim()],
  );
  return result.rows[0]?.id ?? null;
};

const findCommentById = async (id) => {
  const result = await db.query(
    `SELECT id, ticket_id, user_id, comment, created_at
     FROM ticket_comments
     WHERE id = $1`,
    [id],
  );
  return result.rows[0] ?? null;
};

const updateComment = async (id, userId, comment) => {
  const result = await db.query(
    `UPDATE ticket_comments
     SET comment = $3
     WHERE id = $1 AND user_id = $2
     RETURNING id`,
    [id, userId, comment.trim()],
  );
  return result.rowCount > 0;
};

const deleteComment = async (id, userId) => {
  const result = await db.query(
    `DELETE FROM ticket_comments WHERE id = $1 AND user_id = $2`,
    [id, userId],
  );
  return result.rowCount > 0;
};

export {
  listCommentsForTicket,
  createComment,
  findCommentById,
  updateComment,
  deleteComment,
};
