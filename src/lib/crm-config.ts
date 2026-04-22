export const CRM_CONFIG = {
  funnelStages: ["new", "contacted", "qualified", "proposal", "negotiation", "won"],
  probabilities: {
    new: 0.05,
    contacted: 0.15,
    qualified: 0.35,
    proposal: 0.60,
    negotiation: 0.85,
    won: 1.0,
    lost: 0,
  } as Record<string, number>,
  velocityCalculation: {
    targetStatus: "won",
    activityType: "status_change",
  }
};
