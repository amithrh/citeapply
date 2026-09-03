# Phase 1 — WebMCP tool log (real Google Chrome 152.0.7977.66, `--enable-features=WebMCPTesting`)

Every entry below is a verbatim `document.modelContext.executeTool(tool, JSON.stringify(args))` request/response pair captured against `http://localhost:3100` on 2026-09-03. Journey step numbers follow HACKATHON-PLAN.md.


## supported packet

### Step 3 — tool discovery

Response:

```json
[
  "apply_evidence_backed_answers",
  "get_application_state",
  "get_evidence_index",
  "get_form_requirements",
  "get_validation_issues",
  "prepare_submission_review"
]
```

### Step 3 — get_application_state

Request:

```json
{
  "mode": "protected"
}
```

Response:

```json
{
  "ok": false,
  "error": {
    "code": "consent_required",
    "message": "Use the visible CiteApply application to continue.",
    "safeActions": [
      "use_visible_application"
    ]
  }
}
```

### Step 3 — get_evidence_index

Request:

```json
{}
```

Response:

```json
{
  "ok": false,
  "error": {
    "code": "consent_required",
    "message": "Use the visible CiteApply application to continue.",
    "safeActions": [
      "use_visible_application"
    ]
  }
}
```

### Step 3 — get_validation_issues

Request:

```json
{}
```

Response:

```json
{
  "ok": false,
  "error": {
    "code": "consent_required",
    "message": "Use the visible CiteApply application to continue.",
    "safeActions": [
      "use_visible_application"
    ]
  }
}
```

### Step 3 — get_form_requirements

Request:

```json
{
  "mode": "active"
}
```

Response:

```json
{
  "ok": false,
  "error": {
    "code": "consent_required",
    "message": "Use the visible CiteApply application to continue.",
    "safeActions": [
      "use_visible_application"
    ]
  }
}
```

### Step 3 — get_application_state

Request:

```json
{
  "mode": "redacted"
}
```

Response:

```json
{
  "ok": true,
  "data": {
    "access": "consent_required",
    "safeActions": [
      "use_visible_application"
    ]
  }
}
```

### Step 5 — get_application_state

Request:

```json
{
  "mode": "protected"
}
```

Response:

```json
{
  "ok": true,
  "data": {
    "applicationRevision": 2,
    "requirementsVersion": 1,
    "stage": "draft",
    "assistance": "allowed",
    "activeFieldCount": 6,
    "readyFieldCount": 0,
    "blockerCount": 6,
    "fields": [
      {
        "field": "legal_name",
        "status": "missing"
      },
      {
        "field": "student_id",
        "status": "missing"
      },
      {
        "field": "institution",
        "status": "missing"
      },
      {
        "field": "preferred_contact_email",
        "status": "missing"
      },
      {
        "field": "dependency",
        "status": "missing"
      },
      {
        "field": "annual_household_income",
        "status": "missing"
      }
    ],
    "safeActions": [
      "use_visible_application"
    ]
  }
}
```

### Step 5 — get_evidence_index

Request:

```json
{}
```

Response:

```json
{
  "ok": true,
  "data": {
    "documents": [
      {
        "code": "enrollment",
        "title": "Synthetic Enrollment Record",
        "documentClass": "synthetic_enrollment_record"
      },
      {
        "code": "household",
        "title": "Synthetic Household Statement",
        "documentClass": "synthetic_household_statement"
      },
      {
        "code": "income",
        "title": "Synthetic Income Statement",
        "documentClass": "synthetic_income_statement"
      }
    ],
    "claims": [
      {
        "claimHandle": "mG3CbLiUYFlzZP0FjXCfEg",
        "page": 1,
        "document": "enrollment",
        "kind": "legal_name",
        "normalizedValue": "Anaya Rao"
      },
      {
        "claimHandle": "fDFBQV_rFpC2CjhMfZKTZw",
        "page": 1,
        "document": "enrollment",
        "kind": "student_id",
        "normalizedValue": "HZN-2026-0142"
      },
      {
        "claimHandle": "htRWHqc5XjvGLwR_Xc_WMg",
        "page": 1,
        "document": "enrollment",
        "kind": "institution",
        "normalizedValue": "Northstar Community College"
      },
      {
        "claimHandle": "h9gooeRyKZr86Fa44tgKtQ",
        "page": 1,
        "document": "household",
        "kind": "dependency",
        "normalizedValue": true
      },
      {
        "claimHandle": "pgcjtFX5qi_97q1GuXuAqg",
        "page": 1,
        "document": "household",
        "kind": "guardian_name",
        "normalizedValue": "Meera Rao"
      },
      {
        "claimHandle": "GwI1dWtKGP7nAfi_sxo01A",
        "page": 1,
        "document": "household",
        "kind": "household_size",
        "normalizedValue": 4
      },
      {
        "claimHandle": "qaktWwAQOiN436tfCPISXw",
        "page": 1,
        "document": "household",
        "kind": "annual_household_income",
        "normalizedValue": 480000
      },
      {
        "claimHandle": "zFRGEyY_g6YIl0daKJSQlw",
        "page": 1,
        "document": "income",
        "kind": "annual_household_income",
        "normalizedValue": 480000
      }
    ]
  }
}
```

### Step 5 — get_form_requirements

Request:

```json
{
  "mode": "active"
}
```

Response:

```json
{
  "ok": true,
  "data": {
    "applicationRevision": 2,
    "requirementsVersion": 1,
    "fields": [
      {
        "field": "legal_name",
        "label": "Legal name",
        "policy": "evidence",
        "acceptedDocumentClasses": [
          "synthetic_enrollment_record"
        ],
        "active": true
      },
      {
        "field": "student_id",
        "label": "Student ID",
        "policy": "evidence",
        "acceptedDocumentClasses": [
          "synthetic_enrollment_record"
        ],
        "active": true
      },
      {
        "field": "institution",
        "label": "Institution",
        "policy": "evidence",
        "acceptedDocumentClasses": [
          "synthetic_enrollment_record"
        ],
        "active": true
      },
      {
        "field": "preferred_contact_email",
        "label": "Preferred contact email",
        "policy": "applicant_declared_test_email",
        "acceptedDocumentClasses": [],
        "active": true
      },
      {
        "field": "dependency",
        "label": "Dependency status",
        "policy": "evidence",
        "acceptedDocumentClasses": [
          "synthetic_household_statement"
        ],
        "active": true
      },
      {
        "field": "annual_household_income",
        "label": "Annual household income",
        "policy": "income_policy",
        "acceptedDocumentClasses": [
          "synthetic_household_statement",
          "synthetic_income_statement"
        ],
        "active": true
      }
    ]
  }
}
```

### Step 5 — apply_evidence_backed_answers

Request:

```json
{
  "requestId": "07df1ba5-5b7b-4ab9-89ee-e16fdf7b9f41",
  "expectedApplicationRevision": 2,
  "expectedRequirementsVersion": 1,
  "changes": [
    {
      "kind": "bind_claim",
      "field": "legal_name",
      "claimHandle": "mG3CbLiUYFlzZP0FjXCfEg"
    },
    {
      "kind": "bind_claim",
      "field": "student_id",
      "claimHandle": "fDFBQV_rFpC2CjhMfZKTZw"
    },
    {
      "kind": "bind_claim",
      "field": "institution",
      "claimHandle": "htRWHqc5XjvGLwR_Xc_WMg"
    },
    {
      "kind": "bind_claim",
      "field": "dependency",
      "claimHandle": "h9gooeRyKZr86Fa44tgKtQ"
    }
  ]
}
```

Response:

```json
{
  "ok": true,
  "data": {
    "applicationRevision": 3,
    "requirementsVersion": 2,
    "updatedFields": [
      "legal_name",
      "student_id",
      "institution",
      "dependency"
    ],
    "rereadRequirements": true
  }
}
```

### Step 6 — get_application_state

Request:

```json
{
  "mode": "protected"
}
```

Response:

```json
{
  "ok": true,
  "data": {
    "applicationRevision": 3,
    "requirementsVersion": 2,
    "stage": "draft",
    "assistance": "allowed",
    "activeFieldCount": 8,
    "readyFieldCount": 4,
    "blockerCount": 4,
    "fields": [
      {
        "field": "legal_name",
        "status": "ready",
        "value": "Anaya Rao"
      },
      {
        "field": "student_id",
        "status": "ready",
        "value": "HZN-2026-0142"
      },
      {
        "field": "institution",
        "status": "ready",
        "value": "Northstar Community College"
      },
      {
        "field": "preferred_contact_email",
        "status": "missing"
      },
      {
        "field": "dependency",
        "status": "ready",
        "value": true
      },
      {
        "field": "guardian_name",
        "status": "missing"
      },
      {
        "field": "household_size",
        "status": "missing"
      },
      {
        "field": "annual_household_income",
        "status": "missing"
      }
    ],
    "safeActions": [
      "use_visible_application"
    ]
  }
}
```

### Step 8 — apply_evidence_backed_answers

Request:

```json
{
  "requestId": "bfbac94f-1da9-40b4-8f25-fb0987122aa9",
  "expectedApplicationRevision": 3,
  "expectedRequirementsVersion": 2,
  "changes": [
    {
      "kind": "bind_claim",
      "field": "guardian_name",
      "claimHandle": "pgcjtFX5qi_97q1GuXuAqg"
    },
    {
      "kind": "bind_claim",
      "field": "household_size",
      "claimHandle": "GwI1dWtKGP7nAfi_sxo01A"
    },
    {
      "kind": "propose_email",
      "field": "preferred_contact_email",
      "value": "anaya.rao@example.test"
    },
    {
      "kind": "bind_claim",
      "field": "annual_household_income",
      "claimHandle": "zFRGEyY_g6YIl0daKJSQlw"
    }
  ]
}
```

Response:

```json
{
  "ok": true,
  "data": {
    "applicationRevision": 4,
    "requirementsVersion": 2,
    "updatedFields": [
      "preferred_contact_email",
      "guardian_name",
      "household_size",
      "annual_household_income"
    ],
    "rereadRequirements": false
  }
}
```

### Step 9 — get_application_state

Request:

```json
{
  "mode": "protected"
}
```

Response:

```json
{
  "ok": true,
  "data": {
    "applicationRevision": 4,
    "requirementsVersion": 2,
    "stage": "draft",
    "assistance": "allowed",
    "activeFieldCount": 8,
    "readyFieldCount": 7,
    "blockerCount": 1,
    "fields": [
      {
        "field": "legal_name",
        "status": "ready",
        "value": "Anaya Rao"
      },
      {
        "field": "student_id",
        "status": "ready",
        "value": "HZN-2026-0142"
      },
      {
        "field": "institution",
        "status": "ready",
        "value": "Northstar Community College"
      },
      {
        "field": "preferred_contact_email",
        "status": "needs_declaration",
        "value": "anaya.rao@example.test"
      },
      {
        "field": "dependency",
        "status": "ready",
        "value": true
      },
      {
        "field": "guardian_name",
        "status": "ready",
        "value": "Meera Rao"
      },
      {
        "field": "household_size",
        "status": "ready",
        "value": 4
      },
      {
        "field": "annual_household_income",
        "status": "ready",
        "resolution": "source_supported",
        "value": 480000
      }
    ],
    "safeActions": [
      "use_visible_application"
    ]
  }
}
```

### Step 9 — get_validation_issues

Request:

```json
{}
```

Response:

```json
{
  "ok": true,
  "data": {
    "applicationRevision": 4,
    "requirementsVersion": 2,
    "blockers": [
      {
        "code": "declaration_required",
        "field": "preferred_contact_email",
        "message": "Declare the saved synthetic email in CiteApply.",
        "action": "use_visible_application"
      }
    ]
  }
}
```

### Step 9 — prepare_submission_review

Request:

```json
{
  "requestId": "139b3dd2-65a8-4633-954e-ea58a0a01c0b",
  "expectedApplicationRevision": 4,
  "expectedRequirementsVersion": 2
}
```

Response:

```json
{
  "ok": false,
  "error": {
    "code": "not_ready_for_review",
    "message": "The application is not ready for Review.",
    "safeActions": [
      "use_visible_application"
    ],
    "blockers": [
      {
        "code": "declaration_required",
        "field": "preferred_contact_email",
        "message": "Declare the saved synthetic email in CiteApply.",
        "action": "use_visible_application"
      }
    ]
  }
}
```

### Step 11 — get_application_state

Request:

```json
{
  "mode": "protected"
}
```

Response:

```json
{
  "ok": true,
  "data": {
    "applicationRevision": 7,
    "requirementsVersion": 2,
    "stage": "draft",
    "assistance": "allowed",
    "activeFieldCount": 8,
    "readyFieldCount": 8,
    "blockerCount": 0,
    "fields": [
      {
        "field": "legal_name",
        "status": "ready",
        "value": "Anaya Rao"
      },
      {
        "field": "student_id",
        "status": "ready",
        "value": "HZN-2026-0142"
      },
      {
        "field": "institution",
        "status": "ready",
        "value": "Northstar Community College"
      },
      {
        "field": "preferred_contact_email",
        "status": "ready",
        "value": "anaya.rao@example.test",
        "humanActionComplete": true
      },
      {
        "field": "dependency",
        "status": "ready",
        "value": true
      },
      {
        "field": "guardian_name",
        "status": "ready",
        "value": "Meera Rao"
      },
      {
        "field": "household_size",
        "status": "ready",
        "value": 4
      },
      {
        "field": "annual_household_income",
        "status": "ready",
        "resolution": "source_supported",
        "value": 480000
      }
    ],
    "safeActions": [
      "use_visible_application"
    ]
  }
}
```

### Step 11 — prepare_submission_review

Request:

```json
{
  "requestId": "3ff6726c-4dc9-4222-bf00-5c5ed9f49f84",
  "expectedApplicationRevision": 7,
  "expectedRequirementsVersion": 2
}
```

Response:

```json
{
  "ok": true,
  "data": {
    "applicationRevision": 8,
    "requirementsVersion": 2,
    "readiness": "ready",
    "reviewRef": "XQMI5nXE-uRkeBteOG8tFS"
  }
}
```

### Step 11 — get_application_state

Request:

```json
{
  "mode": "protected"
}
```

Response:

```json
{
  "ok": false,
  "error": {
    "code": "consent_required",
    "message": "Use the visible CiteApply application to continue.",
    "safeActions": [
      "use_visible_application"
    ]
  }
}
```

## conflict packet

### Step 3 — tool discovery

Response:

```json
[
  "apply_evidence_backed_answers",
  "get_application_state",
  "get_evidence_index",
  "get_form_requirements",
  "get_validation_issues",
  "prepare_submission_review"
]
```

### Step 3 — get_application_state

Request:

```json
{
  "mode": "protected"
}
```

Response:

```json
{
  "ok": false,
  "error": {
    "code": "consent_required",
    "message": "Use the visible CiteApply application to continue.",
    "safeActions": [
      "use_visible_application"
    ]
  }
}
```

### Step 3 — get_evidence_index

Request:

```json
{}
```

Response:

```json
{
  "ok": false,
  "error": {
    "code": "consent_required",
    "message": "Use the visible CiteApply application to continue.",
    "safeActions": [
      "use_visible_application"
    ]
  }
}
```

### Step 3 — get_validation_issues

Request:

```json
{}
```

Response:

```json
{
  "ok": false,
  "error": {
    "code": "consent_required",
    "message": "Use the visible CiteApply application to continue.",
    "safeActions": [
      "use_visible_application"
    ]
  }
}
```

### Step 3 — get_form_requirements

Request:

```json
{
  "mode": "active"
}
```

Response:

```json
{
  "ok": false,
  "error": {
    "code": "consent_required",
    "message": "Use the visible CiteApply application to continue.",
    "safeActions": [
      "use_visible_application"
    ]
  }
}
```

### Step 3 — get_application_state

Request:

```json
{
  "mode": "redacted"
}
```

Response:

```json
{
  "ok": true,
  "data": {
    "access": "consent_required",
    "safeActions": [
      "use_visible_application"
    ]
  }
}
```

### Step 5 — get_application_state

Request:

```json
{
  "mode": "protected"
}
```

Response:

```json
{
  "ok": true,
  "data": {
    "applicationRevision": 2,
    "requirementsVersion": 1,
    "stage": "draft",
    "assistance": "allowed",
    "activeFieldCount": 6,
    "readyFieldCount": 0,
    "blockerCount": 6,
    "fields": [
      {
        "field": "legal_name",
        "status": "missing"
      },
      {
        "field": "student_id",
        "status": "missing"
      },
      {
        "field": "institution",
        "status": "missing"
      },
      {
        "field": "preferred_contact_email",
        "status": "missing"
      },
      {
        "field": "dependency",
        "status": "missing"
      },
      {
        "field": "annual_household_income",
        "status": "needs_human_action"
      }
    ],
    "safeActions": [
      "use_visible_application"
    ]
  }
}
```

### Step 5 — get_evidence_index

Request:

```json
{}
```

Response:

```json
{
  "ok": true,
  "data": {
    "documents": [
      {
        "code": "enrollment",
        "title": "Synthetic Enrollment Record",
        "documentClass": "synthetic_enrollment_record"
      },
      {
        "code": "household",
        "title": "Synthetic Household Statement",
        "documentClass": "synthetic_household_statement"
      },
      {
        "code": "income",
        "title": "Synthetic Income Statement",
        "documentClass": "synthetic_income_statement"
      }
    ],
    "claims": [
      {
        "claimHandle": "kdAKTNs94c23canyg6yRNA",
        "page": 1,
        "document": "enrollment",
        "kind": "legal_name",
        "normalizedValue": "Anaya Rao"
      },
      {
        "claimHandle": "ZUuvrs7xNkKDgwCGT5_L3A",
        "page": 1,
        "document": "enrollment",
        "kind": "student_id",
        "normalizedValue": "HZN-2026-0142"
      },
      {
        "claimHandle": "HR5xxQTUCgw6cefjkkfi4w",
        "page": 1,
        "document": "enrollment",
        "kind": "institution",
        "normalizedValue": "Northstar Community College"
      },
      {
        "claimHandle": "gdYeji9LEek4IcZahMYmqA",
        "page": 1,
        "document": "household",
        "kind": "dependency",
        "normalizedValue": true
      },
      {
        "claimHandle": "x2uvD1P6kT_FFeU2AIBcBg",
        "page": 1,
        "document": "household",
        "kind": "guardian_name",
        "normalizedValue": "Meera Rao"
      },
      {
        "claimHandle": "oIT_7w2zchI8wW8Pzl_G0Q",
        "page": 1,
        "document": "household",
        "kind": "household_size",
        "normalizedValue": 4
      },
      {
        "claimHandle": "FrcwDCRU25Z_bMEv15nFdA",
        "page": 1,
        "document": "household",
        "kind": "annual_household_income",
        "normalizedValue": 480000
      },
      {
        "claimHandle": "mwoX6cD7rEiZDpkctKhCuA",
        "page": 1,
        "document": "income",
        "kind": "annual_household_income",
        "normalizedValue": 540000
      }
    ]
  }
}
```

### Step 5 — get_form_requirements

Request:

```json
{
  "mode": "active"
}
```

Response:

```json
{
  "ok": true,
  "data": {
    "applicationRevision": 2,
    "requirementsVersion": 1,
    "fields": [
      {
        "field": "legal_name",
        "label": "Legal name",
        "policy": "evidence",
        "acceptedDocumentClasses": [
          "synthetic_enrollment_record"
        ],
        "active": true
      },
      {
        "field": "student_id",
        "label": "Student ID",
        "policy": "evidence",
        "acceptedDocumentClasses": [
          "synthetic_enrollment_record"
        ],
        "active": true
      },
      {
        "field": "institution",
        "label": "Institution",
        "policy": "evidence",
        "acceptedDocumentClasses": [
          "synthetic_enrollment_record"
        ],
        "active": true
      },
      {
        "field": "preferred_contact_email",
        "label": "Preferred contact email",
        "policy": "applicant_declared_test_email",
        "acceptedDocumentClasses": [],
        "active": true
      },
      {
        "field": "dependency",
        "label": "Dependency status",
        "policy": "evidence",
        "acceptedDocumentClasses": [
          "synthetic_household_statement"
        ],
        "active": true
      },
      {
        "field": "annual_household_income",
        "label": "Annual household income",
        "policy": "income_policy",
        "acceptedDocumentClasses": [
          "synthetic_household_statement",
          "synthetic_income_statement"
        ],
        "active": true
      }
    ]
  }
}
```

### Step 7 — apply_evidence_backed_answers

Request:

```json
{
  "requestId": "96739090-b900-478f-9f1b-1f50f2cd9868",
  "expectedApplicationRevision": 2,
  "expectedRequirementsVersion": 1,
  "changes": [
    {
      "kind": "bind_claim",
      "field": "annual_household_income",
      "claimHandle": "mwoX6cD7rEiZDpkctKhCuA"
    }
  ]
}
```

Response:

```json
{
  "ok": false,
  "error": {
    "code": "conflict_requires_human",
    "message": "Income sources disagree. Resolve this in CiteApply.",
    "safeActions": [
      "resolve_in_visible_application"
    ]
  }
}
```

### Step 7 — get_application_state

Request:

```json
{
  "mode": "protected"
}
```

Response:

```json
{
  "ok": true,
  "data": {
    "applicationRevision": 2,
    "requirementsVersion": 1,
    "stage": "draft",
    "assistance": "allowed",
    "activeFieldCount": 6,
    "readyFieldCount": 0,
    "blockerCount": 6,
    "fields": [
      {
        "field": "legal_name",
        "status": "missing"
      },
      {
        "field": "student_id",
        "status": "missing"
      },
      {
        "field": "institution",
        "status": "missing"
      },
      {
        "field": "preferred_contact_email",
        "status": "missing"
      },
      {
        "field": "dependency",
        "status": "missing"
      },
      {
        "field": "annual_household_income",
        "status": "needs_human_action"
      }
    ],
    "safeActions": [
      "use_visible_application"
    ]
  }
}
```

### Step 5 — apply_evidence_backed_answers

Request:

```json
{
  "requestId": "c5c383a4-a604-480e-9266-b9ff40a88a6a",
  "expectedApplicationRevision": 2,
  "expectedRequirementsVersion": 1,
  "changes": [
    {
      "kind": "bind_claim",
      "field": "legal_name",
      "claimHandle": "kdAKTNs94c23canyg6yRNA"
    },
    {
      "kind": "bind_claim",
      "field": "student_id",
      "claimHandle": "ZUuvrs7xNkKDgwCGT5_L3A"
    },
    {
      "kind": "bind_claim",
      "field": "institution",
      "claimHandle": "HR5xxQTUCgw6cefjkkfi4w"
    },
    {
      "kind": "bind_claim",
      "field": "dependency",
      "claimHandle": "gdYeji9LEek4IcZahMYmqA"
    }
  ]
}
```

Response:

```json
{
  "ok": true,
  "data": {
    "applicationRevision": 3,
    "requirementsVersion": 2,
    "updatedFields": [
      "legal_name",
      "student_id",
      "institution",
      "dependency"
    ],
    "rereadRequirements": true
  }
}
```

### Step 6 — get_application_state

Request:

```json
{
  "mode": "protected"
}
```

Response:

```json
{
  "ok": true,
  "data": {
    "applicationRevision": 3,
    "requirementsVersion": 2,
    "stage": "draft",
    "assistance": "allowed",
    "activeFieldCount": 8,
    "readyFieldCount": 4,
    "blockerCount": 4,
    "fields": [
      {
        "field": "legal_name",
        "status": "ready",
        "value": "Anaya Rao"
      },
      {
        "field": "student_id",
        "status": "ready",
        "value": "HZN-2026-0142"
      },
      {
        "field": "institution",
        "status": "ready",
        "value": "Northstar Community College"
      },
      {
        "field": "preferred_contact_email",
        "status": "missing"
      },
      {
        "field": "dependency",
        "status": "ready",
        "value": true
      },
      {
        "field": "guardian_name",
        "status": "missing"
      },
      {
        "field": "household_size",
        "status": "missing"
      },
      {
        "field": "annual_household_income",
        "status": "needs_human_action"
      }
    ],
    "safeActions": [
      "use_visible_application"
    ]
  }
}
```

### Step 8 — apply_evidence_backed_answers

Request:

```json
{
  "requestId": "db767bc8-4b2f-414f-8c0a-4a3a996175f2",
  "expectedApplicationRevision": 3,
  "expectedRequirementsVersion": 2,
  "changes": [
    {
      "kind": "bind_claim",
      "field": "guardian_name",
      "claimHandle": "x2uvD1P6kT_FFeU2AIBcBg"
    },
    {
      "kind": "bind_claim",
      "field": "household_size",
      "claimHandle": "oIT_7w2zchI8wW8Pzl_G0Q"
    },
    {
      "kind": "propose_email",
      "field": "preferred_contact_email",
      "value": "anaya.rao@example.test"
    }
  ]
}
```

Response:

```json
{
  "ok": true,
  "data": {
    "applicationRevision": 4,
    "requirementsVersion": 2,
    "updatedFields": [
      "preferred_contact_email",
      "guardian_name",
      "household_size"
    ],
    "rereadRequirements": false
  }
}
```

### Step 9 — get_application_state

Request:

```json
{
  "mode": "protected"
}
```

Response:

```json
{
  "ok": true,
  "data": {
    "applicationRevision": 4,
    "requirementsVersion": 2,
    "stage": "draft",
    "assistance": "allowed",
    "activeFieldCount": 8,
    "readyFieldCount": 6,
    "blockerCount": 2,
    "fields": [
      {
        "field": "legal_name",
        "status": "ready",
        "value": "Anaya Rao"
      },
      {
        "field": "student_id",
        "status": "ready",
        "value": "HZN-2026-0142"
      },
      {
        "field": "institution",
        "status": "ready",
        "value": "Northstar Community College"
      },
      {
        "field": "preferred_contact_email",
        "status": "needs_declaration",
        "value": "anaya.rao@example.test"
      },
      {
        "field": "dependency",
        "status": "ready",
        "value": true
      },
      {
        "field": "guardian_name",
        "status": "ready",
        "value": "Meera Rao"
      },
      {
        "field": "household_size",
        "status": "ready",
        "value": 4
      },
      {
        "field": "annual_household_income",
        "status": "needs_human_action"
      }
    ],
    "safeActions": [
      "use_visible_application"
    ]
  }
}
```

### Step 9 — get_validation_issues

Request:

```json
{}
```

Response:

```json
{
  "ok": true,
  "data": {
    "applicationRevision": 4,
    "requirementsVersion": 2,
    "blockers": [
      {
        "code": "conflict_requires_human",
        "field": "annual_household_income",
        "message": "Income sources disagree. Resolve this in CiteApply.",
        "action": "resolve_in_visible_application"
      },
      {
        "code": "declaration_required",
        "field": "preferred_contact_email",
        "message": "Declare the saved synthetic email in CiteApply.",
        "action": "use_visible_application"
      }
    ]
  }
}
```

### Step 9 — prepare_submission_review

Request:

```json
{
  "requestId": "e79d187d-13c7-4ea2-ac50-6f6a7e90a069",
  "expectedApplicationRevision": 4,
  "expectedRequirementsVersion": 2
}
```

Response:

```json
{
  "ok": false,
  "error": {
    "code": "not_ready_for_review",
    "message": "The application is not ready for Review.",
    "safeActions": [
      "use_visible_application"
    ],
    "blockers": [
      {
        "code": "conflict_requires_human",
        "field": "annual_household_income",
        "message": "Income sources disagree. Resolve this in CiteApply.",
        "action": "resolve_in_visible_application"
      },
      {
        "code": "declaration_required",
        "field": "preferred_contact_email",
        "message": "Declare the saved synthetic email in CiteApply.",
        "action": "use_visible_application"
      }
    ]
  }
}
```

### Step 11 — get_application_state

Request:

```json
{
  "mode": "protected"
}
```

Response:

```json
{
  "ok": true,
  "data": {
    "applicationRevision": 8,
    "requirementsVersion": 2,
    "stage": "draft",
    "assistance": "allowed",
    "activeFieldCount": 8,
    "readyFieldCount": 8,
    "blockerCount": 0,
    "fields": [
      {
        "field": "legal_name",
        "status": "ready",
        "value": "Anaya Rao"
      },
      {
        "field": "student_id",
        "status": "ready",
        "value": "HZN-2026-0142"
      },
      {
        "field": "institution",
        "status": "ready",
        "value": "Northstar Community College"
      },
      {
        "field": "preferred_contact_email",
        "status": "ready",
        "value": "anaya.rao@example.test",
        "humanActionComplete": true
      },
      {
        "field": "dependency",
        "status": "ready",
        "value": true
      },
      {
        "field": "guardian_name",
        "status": "ready",
        "value": "Meera Rao"
      },
      {
        "field": "household_size",
        "status": "ready",
        "value": 4
      },
      {
        "field": "annual_household_income",
        "status": "ready",
        "resolution": "human_completed",
        "humanActionComplete": true
      }
    ],
    "safeActions": [
      "use_visible_application"
    ]
  }
}
```

### Step 11 — prepare_submission_review

Request:

```json
{
  "requestId": "016499de-6144-4833-80d9-bd9c96e49ac4",
  "expectedApplicationRevision": 8,
  "expectedRequirementsVersion": 2
}
```

Response:

```json
{
  "ok": true,
  "data": {
    "applicationRevision": 9,
    "requirementsVersion": 2,
    "readiness": "ready",
    "reviewRef": "XeJdBsYugoOtzY4Vfufi_p"
  }
}
```

### Step 11 — get_application_state

Request:

```json
{
  "mode": "protected"
}
```

Response:

```json
{
  "ok": false,
  "error": {
    "code": "consent_required",
    "message": "Use the visible CiteApply application to continue.",
    "safeActions": [
      "use_visible_application"
    ]
  }
}
```
