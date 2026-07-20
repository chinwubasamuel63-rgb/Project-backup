import Counter from "../models/Counter.js";

export const generateTicketNumber =
  async () => {
    const counter =
      await Counter.findOneAndUpdate(
        {
          name: "supportTicket",
        },
        {
          $inc: {
            value: 1,
          },
        },
        {
          new: true,
          upsert: true,
        }
      );

    return `DSN-${String(
      counter.value
    ).padStart(6, "0")}`;
  };