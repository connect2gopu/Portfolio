// Temporary pause while automatic network grouping is investigated.
// Keep this server-side so older clients also cannot issue Redis commands.
export const SHAREIT_PAUSED = true;
export const SHAREIT_PAUSE_MESSAGE = "ShareIt pairing and discovery are paused while network grouping is investigated. No Redis reads or writes are being made.";
