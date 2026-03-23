import db from "../db.js";

const TICKET_SELECT = `
  SELECT t.id, t.title, t.description, t.status, t.user_id, t.assigned_to, t.category_id,
         t.created_at, t.updated_at,
         c.name AS category_name,
         u.name AS user_name,
         u.email AS user_email,
         a.name AS assignee_name
  FROM tickets t
  JOIN categories c ON c.id = t.category_id
  JOIN users u ON u.id = t.user_id
  LEFT JOIN users a ON a.id = t.assigned_to
`;

const listTicketsForUser = async (userId) => {
  const result = await db.query(
    `${TICKET_SELECT}
     WHERE t.user_id = $1
     ORDER BY t.updated_at DESC`,
    [userId],
  );
  return result.rows;
};

const listAllTickets = async () => {
  const result = await db.query(
    `${TICKET_SELECT}
     ORDER BY t.updated_at DESC`,
  );
  return result.rows;
};

const findTicketRowById = async (id) => {
  const result = await db.query(`${TICKET_SELECT} WHERE t.id = $1`, [id]);
  return result.rows[0] ?? null;
};

const createTicket = async ({ title, description, category_id, user_id }) => {
  const result = await db.query(
    `INSERT INTO tickets (title, description, category_id, user_id, status)
     VALUES ($1, $2, $3, $4, 'open')
     RETURNING id`,
    [title.trim(), description.trim(), category_id, user_id],
  );
  return result.rows[0]?.id ?? null;
};

const updateTicketStatus = async (id, status) => {
  const result = await db.query(
    `UPDATE tickets SET status = $2 WHERE id = $1 RETURNING id`,
    [id, status],
  );
  return result.rowCount > 0;
};

const updateTicketAssignee = async (id, assignedToUserId) => {
  const result = await db.query(
    `UPDATE tickets SET assigned_to = $2 WHERE id = $1 RETURNING id`,
    [id, assignedToUserId],
  );
  return result.rowCount > 0;
};

export {
  listTicketsForUser,
  listAllTickets,
  findTicketRowById,
  createTicket,
  updateTicketStatus,
  updateTicketAssignee,
};
