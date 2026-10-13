package edu.amrita.campusnav.dto;

import java.util.ArrayList;
import java.util.List;

/**
 * Audit result from CampusDataValidator.
 */
public class ValidationReport {
    private boolean valid;
    private int vertexCount;
    private int edgeCount;
    private int connectedComponentsCount;
    private List<String> isolatedVertices = new ArrayList<>();
    private List<String> warnings = new ArrayList<>();
    private List<String> errors = new ArrayList<>();

    public ValidationReport() {}

    public boolean isValid() { return valid; }
    public void setValid(boolean valid) { this.valid = valid; }

    public int getVertexCount() { return vertexCount; }
    public void setVertexCount(int vertexCount) { this.vertexCount = vertexCount; }

    public int getEdgeCount() { return edgeCount; }
    public void setEdgeCount(int edgeCount) { this.edgeCount = edgeCount; }

    public int getConnectedComponentsCount() { return connectedComponentsCount; }
    public void setConnectedComponentsCount(int connectedComponentsCount) { this.connectedComponentsCount = connectedComponentsCount; }

    public List<String> getIsolatedVertices() { return isolatedVertices; }
    public void setIsolatedVertices(List<String> isolatedVertices) { this.isolatedVertices = isolatedVertices; }

    public List<String> getWarnings() { return warnings; }
    public void setWarnings(List<String> warnings) { this.warnings = warnings; }

    public List<String> getErrors() { return errors; }
    public void setErrors(List<String> errors) { this.errors = errors; }
}
