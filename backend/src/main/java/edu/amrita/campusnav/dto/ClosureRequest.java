package edu.amrita.campusnav.dto;

import edu.amrita.campusnav.model.WalkabilityStatus;

public class ClosureRequest {
    private String edgeId;
    private WalkabilityStatus status = WalkabilityStatus.TEMPORARILY_CLOSED;
    private String reason;

    public ClosureRequest() {}

    public String getEdgeId() { return edgeId; }
    public void setEdgeId(String edgeId) { this.edgeId = edgeId; }

    public WalkabilityStatus getStatus() { return status; }
    public void setStatus(WalkabilityStatus status) { this.status = status; }

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
}
