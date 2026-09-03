

## supported packet

**get_application_state**

request

```json
{"mode":"redacted"}
```

response

```json
{"ok":true,"data":{"access":"consent_required","safeActions":["use_visible_application"]}}
```

**get_application_state**

request

```json
{"mode":"protected"}
```

response

```json
{"ok":false,"error":{"code":"consent_required","message":"Use the visible CiteApply application to continue.","safeActions":["use_visible_application"]}}
```

**get_form_requirements**

request

```json
{"mode":"active"}
```

response

```json
{"ok":false,"error":{"code":"consent_required","message":"Use the visible CiteApply application to continue.","safeActions":["use_visible_application"]}}
```

**get_evidence_index**

request

```json
{}
```

response

```json
{"ok":false,"error":{"code":"consent_required","message":"Use the visible CiteApply application to continue.","safeActions":["use_visible_application"]}}
```

**get_validation_issues**

request

```json
{}
```

response

```json
{"ok":false,"error":{"code":"consent_required","message":"Use the visible CiteApply application to continue.","safeActions":["use_visible_application"]}}
```

**get_application_state**

request

```json
{"mode":"protected"}
```

response

```json
{"ok":true,"data":{"applicationRevision":2,"requirementsVersion":1,"stage":"draft","assistance":"allowed","activeFieldCount":6,"readyFieldCount":0,"blockerCount":6,"fields":[{"field":"legal_name","status":"missing"},{"field":"student_id","status":"missing"},{"field":"institution","status":"missing"},{"field":"preferred_contact_email","status":"missing"},{"field":"dependency","status":"missing"},{"field":"annual_household_income","status":"missing"}],"safeActions":["use_visible_application"]}}
```

**get_form_requirements**

request

```json
{"mode":"active"}
```

response

```json
{"ok":true,"data":{"applicationRevision":2,"requirementsVersion":1,"fields":[{"field":"legal_name","label":"Legal name","policy":"evidence","acceptedDocumentClasses":["synthetic_enrollment_record"],"active":true},{"field":"student_id","label":"Student ID","policy":"evidence","acceptedDocumentClasses":["synthetic_enrollment_record"],"active":true},{"field":"institution","label":"Institution","policy":"evidence","acceptedDocumentClasses":["synthetic_enrollment_record"],"active":true},{"field":"preferred_contact_email","label":"Preferred contact email","policy":"applicant_declared_test_email","acceptedDocumentClasses":[],"active":true},{"field":"dependency","label":"Dependency status","policy":"evidence","acceptedDocumentClasses":["synthetic_household_statement"],"active":true},{"field":"annual_household_income","label":"Annual household income","policy":"income_policy","acceptedDocumentClasses":["synthetic_household_statement","synthetic_income_statement"],"active":true}]}}
```

**get_evidence_index**

request

```json
{}
```

response

```json
{"ok":true,"data":{"documents":[{"code":"enrollment","title":"Synthetic Enrollment Record","documentClass":"synthetic_enrollment_record"},{"code":"household","title":"Synthetic Household Statement","documentClass":"synthetic_household_statement"},{"code":"income","title":"Synthetic Income Statement","documentClass":"synthetic_income_statement"}],"claims":[{"claimHandle":"_yYiyD2X51W5fg2nwS4ltQ","page":1,"document":"enrollment","kind":"legal_name","normalizedValue":"Anaya Rao"},{"claimHandle":"nMGpGPDcksehBoi0Jb-_Og","page":1,"document":"enrollment","kind":"student_id","normalizedValue":"HZN-2026-0142"},{"claimHandle":"zShQyevmSux2-RQqeppsAQ","page":1,"document":"enrollment","kind":"institution","normalizedValue":"Northstar Community College"},{"claimHandle":"l3a954FL-fuiLYcw-XdOxg","page":1,"document":"household","kind":"dependency","normalizedValue":true},{"claimHandle":"n2ObVZuwFwVp5vMZNmTwGA","page":1,"document":"household","kind":"guardian_name","normalizedValue":"Meera Rao"},{"claimHandle":"NEM06g59y1GhR7O5Lqb1Yw","page":1,"document":"household","kind":"household_size","normalizedValue":4},{"claimHandle":"vJmzl8m5zC4xaAdsbJeDcw","page":1,"document":"household","kind":"annual_household_income","normalizedValue":480000},{"claimHandle":"dUvXVfQ7IdyiTC0itrbCTw","page":1,"document":"income","kind":"annual_household_income","normalizedValue":480000}]}}
```

**apply_evidence_backed_answers**

request

```json
{"requestId":"3913f81d-438d-471a-b1f1-a13c62389448","expectedApplicationRevision":2,"expectedRequirementsVersion":1,"changes":[{"kind":"bind_claim","field":"legal_name","claimHandle":"_yYiyD2X51W5fg2nwS4ltQ"},{"kind":"bind_claim","field":"student_id","claimHandle":"nMGpGPDcksehBoi0Jb-_Og"},{"kind":"bind_claim","field":"institution","claimHandle":"zShQyevmSux2-RQqeppsAQ"},{"kind":"bind_claim","field":"dependency","claimHandle":"l3a954FL-fuiLYcw-XdOxg"}]}
```

response

```json
{"ok":true,"data":{"applicationRevision":3,"requirementsVersion":2,"updatedFields":["legal_name","student_id","institution","dependency"],"rereadRequirements":true}}
```

**get_application_state**

request

```json
{"mode":"protected"}
```

response

```json
{"ok":true,"data":{"applicationRevision":3,"requirementsVersion":2,"stage":"draft","assistance":"allowed","activeFieldCount":8,"readyFieldCount":4,"blockerCount":4,"fields":[{"field":"legal_name","status":"ready","value":"Anaya Rao"},{"field":"student_id","status":"ready","value":"HZN-2026-0142"},{"field":"institution","status":"ready","value":"Northstar Community College"},{"field":"preferred_contact_email","status":"missing"},{"field":"dependency","status":"ready","value":true},{"field":"guardian_name","status":"missing"},{"field":"household_size","status":"missing"},{"field":"annual_household_income","status":"missing"}],"safeActions":["use_visible_application"]}}
```

**get_form_requirements**

request

```json
{"mode":"active"}
```

response

```json
{"ok":true,"data":{"applicationRevision":3,"requirementsVersion":2,"fields":[{"field":"legal_name","label":"Legal name","policy":"evidence","acceptedDocumentClasses":["synthetic_enrollment_record"],"active":true},{"field":"student_id","label":"Student ID","policy":"evidence","acceptedDocumentClasses":["synthetic_enrollment_record"],"active":true},{"field":"institution","label":"Institution","policy":"evidence","acceptedDocumentClasses":["synthetic_enrollment_record"],"active":true},{"field":"preferred_contact_email","label":"Preferred contact email","policy":"applicant_declared_test_email","acceptedDocumentClasses":[],"active":true},{"field":"dependency","label":"Dependency status","policy":"evidence","acceptedDocumentClasses":["synthetic_household_statement"],"active":true},{"field":"guardian_name","label":"Guardian name","policy":"evidence","acceptedDocumentClasses":["synthetic_household_statement"],"condition":{"field":"dependency","equals":true},"active":true},{"field":"household_size","label":"Household size","policy":"evidence","acceptedDocumentClasses":["synthetic_household_statement"],"condition":{"field":"dependency","equals":true},"active":true},{"field":"annual_household_income","label":"Annual household income","policy":"income_policy","acceptedDocumentClasses":["synthetic_household_statement","synthetic_income_statement"],"active":true}]}}
```

**apply_evidence_backed_answers**

request

```json
{"requestId":"1bba7b34-b4e0-4c26-96d8-4b63ea315c0a","expectedApplicationRevision":3,"expectedRequirementsVersion":2,"changes":[{"kind":"bind_claim","field":"guardian_name","claimHandle":"n2ObVZuwFwVp5vMZNmTwGA"},{"kind":"bind_claim","field":"household_size","claimHandle":"NEM06g59y1GhR7O5Lqb1Yw"}]}
```

response

```json
{"ok":true,"data":{"applicationRevision":4,"requirementsVersion":2,"updatedFields":["guardian_name","household_size"],"rereadRequirements":false}}
```

**get_application_state**

request

```json
{"mode":"protected"}
```

response

```json
{"ok":true,"data":{"applicationRevision":4,"requirementsVersion":2,"stage":"draft","assistance":"allowed","activeFieldCount":8,"readyFieldCount":6,"blockerCount":2,"fields":[{"field":"legal_name","status":"ready","value":"Anaya Rao"},{"field":"student_id","status":"ready","value":"HZN-2026-0142"},{"field":"institution","status":"ready","value":"Northstar Community College"},{"field":"preferred_contact_email","status":"missing"},{"field":"dependency","status":"ready","value":true},{"field":"guardian_name","status":"ready","value":"Meera Rao"},{"field":"household_size","status":"ready","value":4},{"field":"annual_household_income","status":"missing"}],"safeActions":["use_visible_application"]}}
```

**apply_evidence_backed_answers**

request

```json
{"requestId":"1798ae39-d721-4d38-85d7-919491a2c441","expectedApplicationRevision":4,"expectedRequirementsVersion":2,"changes":[{"kind":"bind_claim","field":"annual_household_income","claimHandle":"dUvXVfQ7IdyiTC0itrbCTw"}]}
```

response

```json
{"ok":true,"data":{"applicationRevision":5,"requirementsVersion":2,"updatedFields":["annual_household_income"],"rereadRequirements":false}}
```

**get_application_state**

request

```json
{"mode":"protected"}
```

response

```json
{"ok":true,"data":{"applicationRevision":5,"requirementsVersion":2,"stage":"draft","assistance":"allowed","activeFieldCount":8,"readyFieldCount":7,"blockerCount":1,"fields":[{"field":"legal_name","status":"ready","value":"Anaya Rao"},{"field":"student_id","status":"ready","value":"HZN-2026-0142"},{"field":"institution","status":"ready","value":"Northstar Community College"},{"field":"preferred_contact_email","status":"missing"},{"field":"dependency","status":"ready","value":true},{"field":"guardian_name","status":"ready","value":"Meera Rao"},{"field":"household_size","status":"ready","value":4},{"field":"annual_household_income","status":"ready","resolution":"source_supported","value":480000}],"safeActions":["use_visible_application"]}}
```

**apply_evidence_backed_answers**

request

```json
{"requestId":"a7a404f7-e267-439c-94b9-e90bfcbecd08","expectedApplicationRevision":5,"expectedRequirementsVersion":2,"changes":[{"kind":"propose_email","field":"preferred_contact_email","value":"anaya.rao@example.test"}]}
```

response

```json
{"ok":true,"data":{"applicationRevision":6,"requirementsVersion":2,"updatedFields":["preferred_contact_email"],"rereadRequirements":false}}
```

**get_application_state**

request

```json
{"mode":"protected"}
```

response

```json
{"ok":true,"data":{"applicationRevision":6,"requirementsVersion":2,"stage":"draft","assistance":"allowed","activeFieldCount":8,"readyFieldCount":7,"blockerCount":1,"fields":[{"field":"legal_name","status":"ready","value":"Anaya Rao"},{"field":"student_id","status":"ready","value":"HZN-2026-0142"},{"field":"institution","status":"ready","value":"Northstar Community College"},{"field":"preferred_contact_email","status":"needs_declaration","value":"anaya.rao@example.test"},{"field":"dependency","status":"ready","value":true},{"field":"guardian_name","status":"ready","value":"Meera Rao"},{"field":"household_size","status":"ready","value":4},{"field":"annual_household_income","status":"ready","resolution":"source_supported","value":480000}],"safeActions":["use_visible_application"]}}
```

**prepare_submission_review**

request

```json
{"requestId":"ad05a4de-00b0-4bb3-a27b-9f8621ca44cc","expectedApplicationRevision":6,"expectedRequirementsVersion":2}
```

response

```json
{"ok":false,"error":{"code":"not_ready_for_review","message":"The application is not ready for Review.","safeActions":["use_visible_application"],"blockers":[{"code":"declaration_required","field":"preferred_contact_email","message":"Declare the saved synthetic email in CiteApply.","action":"use_visible_application"}]}}
```

**get_application_state**

request

```json
{"mode":"protected"}
```

response

```json
{"ok":true,"data":{"applicationRevision":7,"requirementsVersion":2,"stage":"draft","assistance":"allowed","activeFieldCount":8,"readyFieldCount":8,"blockerCount":0,"fields":[{"field":"legal_name","status":"ready","value":"Anaya Rao"},{"field":"student_id","status":"ready","value":"HZN-2026-0142"},{"field":"institution","status":"ready","value":"Northstar Community College"},{"field":"preferred_contact_email","status":"ready","value":"anaya.rao@example.test","humanActionComplete":true},{"field":"dependency","status":"ready","value":true},{"field":"guardian_name","status":"ready","value":"Meera Rao"},{"field":"household_size","status":"ready","value":4},{"field":"annual_household_income","status":"ready","resolution":"source_supported","value":480000}],"safeActions":["use_visible_application"]}}
```

**prepare_submission_review**

request

```json
{"requestId":"e0f34be7-81c9-40e2-9695-bd8bc1d5231f","expectedApplicationRevision":7,"expectedRequirementsVersion":2}
```

response

```json
{"ok":true,"data":{"applicationRevision":8,"requirementsVersion":2,"readiness":"ready","reviewRef":"duymvE8h6Cr9I65dEv9PZN"}}
```

**get_application_state**

request

```json
{"mode":"protected"}
```

response

```json
{"ok":false,"error":{"code":"consent_required","message":"Use the visible CiteApply application to continue.","safeActions":["use_visible_application"]}}
```


## conflict packet

**get_application_state**

request

```json
{"mode":"redacted"}
```

response

```json
{"ok":true,"data":{"access":"consent_required","safeActions":["use_visible_application"]}}
```

**get_application_state**

request

```json
{"mode":"protected"}
```

response

```json
{"ok":false,"error":{"code":"consent_required","message":"Use the visible CiteApply application to continue.","safeActions":["use_visible_application"]}}
```

**get_form_requirements**

request

```json
{"mode":"active"}
```

response

```json
{"ok":false,"error":{"code":"consent_required","message":"Use the visible CiteApply application to continue.","safeActions":["use_visible_application"]}}
```

**get_evidence_index**

request

```json
{}
```

response

```json
{"ok":false,"error":{"code":"consent_required","message":"Use the visible CiteApply application to continue.","safeActions":["use_visible_application"]}}
```

**get_validation_issues**

request

```json
{}
```

response

```json
{"ok":false,"error":{"code":"consent_required","message":"Use the visible CiteApply application to continue.","safeActions":["use_visible_application"]}}
```

**get_application_state**

request

```json
{"mode":"protected"}
```

response

```json
{"ok":true,"data":{"applicationRevision":2,"requirementsVersion":1,"stage":"draft","assistance":"allowed","activeFieldCount":6,"readyFieldCount":0,"blockerCount":6,"fields":[{"field":"legal_name","status":"missing"},{"field":"student_id","status":"missing"},{"field":"institution","status":"missing"},{"field":"preferred_contact_email","status":"missing"},{"field":"dependency","status":"missing"},{"field":"annual_household_income","status":"needs_human_action"}],"safeActions":["use_visible_application"]}}
```

**get_form_requirements**

request

```json
{"mode":"active"}
```

response

```json
{"ok":true,"data":{"applicationRevision":2,"requirementsVersion":1,"fields":[{"field":"legal_name","label":"Legal name","policy":"evidence","acceptedDocumentClasses":["synthetic_enrollment_record"],"active":true},{"field":"student_id","label":"Student ID","policy":"evidence","acceptedDocumentClasses":["synthetic_enrollment_record"],"active":true},{"field":"institution","label":"Institution","policy":"evidence","acceptedDocumentClasses":["synthetic_enrollment_record"],"active":true},{"field":"preferred_contact_email","label":"Preferred contact email","policy":"applicant_declared_test_email","acceptedDocumentClasses":[],"active":true},{"field":"dependency","label":"Dependency status","policy":"evidence","acceptedDocumentClasses":["synthetic_household_statement"],"active":true},{"field":"annual_household_income","label":"Annual household income","policy":"income_policy","acceptedDocumentClasses":["synthetic_household_statement","synthetic_income_statement"],"active":true}]}}
```

**get_evidence_index**

request

```json
{}
```

response

```json
{"ok":true,"data":{"documents":[{"code":"enrollment","title":"Synthetic Enrollment Record","documentClass":"synthetic_enrollment_record"},{"code":"household","title":"Synthetic Household Statement","documentClass":"synthetic_household_statement"},{"code":"income","title":"Synthetic Income Statement","documentClass":"synthetic_income_statement"}],"claims":[{"claimHandle":"3B0Ly1OkIgE0Vnp2zAQzfg","page":1,"document":"enrollment","kind":"legal_name","normalizedValue":"Anaya Rao"},{"claimHandle":"uKXorfHEbvgN1E_NnIa09A","page":1,"document":"enrollment","kind":"student_id","normalizedValue":"HZN-2026-0142"},{"claimHandle":"c0_YTFZhzxtEg2XVODPpkA","page":1,"document":"enrollment","kind":"institution","normalizedValue":"Northstar Community College"},{"claimHandle":"-sOY-h3D3DzjAG1CHhafCw","page":1,"document":"household","kind":"dependency","normalizedValue":true},{"claimHandle":"gxq4GT8QHf5rk4ROcNHTow","page":1,"document":"household","kind":"guardian_name","normalizedValue":"Meera Rao"},{"claimHandle":"NbJ7kPfpj3HIVumK8gQC_A","page":1,"document":"household","kind":"household_size","normalizedValue":4},{"claimHandle":"waz3eAgX22ErNc1LyZqh9w","page":1,"document":"household","kind":"annual_household_income","normalizedValue":480000},{"claimHandle":"hloC2FU0gcv0AhvOoopGlg","page":1,"document":"income","kind":"annual_household_income","normalizedValue":540000}]}}
```

**apply_evidence_backed_answers**

request

```json
{"requestId":"f1787ae4-716b-464f-905d-cdb7e4251519","expectedApplicationRevision":2,"expectedRequirementsVersion":1,"changes":[{"kind":"bind_claim","field":"legal_name","claimHandle":"3B0Ly1OkIgE0Vnp2zAQzfg"},{"kind":"bind_claim","field":"student_id","claimHandle":"uKXorfHEbvgN1E_NnIa09A"},{"kind":"bind_claim","field":"institution","claimHandle":"c0_YTFZhzxtEg2XVODPpkA"},{"kind":"bind_claim","field":"dependency","claimHandle":"-sOY-h3D3DzjAG1CHhafCw"}]}
```

response

```json
{"ok":true,"data":{"applicationRevision":3,"requirementsVersion":2,"updatedFields":["legal_name","student_id","institution","dependency"],"rereadRequirements":true}}
```

**get_application_state**

request

```json
{"mode":"protected"}
```

response

```json
{"ok":true,"data":{"applicationRevision":3,"requirementsVersion":2,"stage":"draft","assistance":"allowed","activeFieldCount":8,"readyFieldCount":4,"blockerCount":4,"fields":[{"field":"legal_name","status":"ready","value":"Anaya Rao"},{"field":"student_id","status":"ready","value":"HZN-2026-0142"},{"field":"institution","status":"ready","value":"Northstar Community College"},{"field":"preferred_contact_email","status":"missing"},{"field":"dependency","status":"ready","value":true},{"field":"guardian_name","status":"missing"},{"field":"household_size","status":"missing"},{"field":"annual_household_income","status":"needs_human_action"}],"safeActions":["use_visible_application"]}}
```

**get_form_requirements**

request

```json
{"mode":"active"}
```

response

```json
{"ok":true,"data":{"applicationRevision":3,"requirementsVersion":2,"fields":[{"field":"legal_name","label":"Legal name","policy":"evidence","acceptedDocumentClasses":["synthetic_enrollment_record"],"active":true},{"field":"student_id","label":"Student ID","policy":"evidence","acceptedDocumentClasses":["synthetic_enrollment_record"],"active":true},{"field":"institution","label":"Institution","policy":"evidence","acceptedDocumentClasses":["synthetic_enrollment_record"],"active":true},{"field":"preferred_contact_email","label":"Preferred contact email","policy":"applicant_declared_test_email","acceptedDocumentClasses":[],"active":true},{"field":"dependency","label":"Dependency status","policy":"evidence","acceptedDocumentClasses":["synthetic_household_statement"],"active":true},{"field":"guardian_name","label":"Guardian name","policy":"evidence","acceptedDocumentClasses":["synthetic_household_statement"],"condition":{"field":"dependency","equals":true},"active":true},{"field":"household_size","label":"Household size","policy":"evidence","acceptedDocumentClasses":["synthetic_household_statement"],"condition":{"field":"dependency","equals":true},"active":true},{"field":"annual_household_income","label":"Annual household income","policy":"income_policy","acceptedDocumentClasses":["synthetic_household_statement","synthetic_income_statement"],"active":true}]}}
```

**apply_evidence_backed_answers**

request

```json
{"requestId":"d5f8b3e5-b3b0-486a-ae6b-80c1be9b5f3a","expectedApplicationRevision":3,"expectedRequirementsVersion":2,"changes":[{"kind":"bind_claim","field":"guardian_name","claimHandle":"gxq4GT8QHf5rk4ROcNHTow"},{"kind":"bind_claim","field":"household_size","claimHandle":"NbJ7kPfpj3HIVumK8gQC_A"}]}
```

response

```json
{"ok":true,"data":{"applicationRevision":4,"requirementsVersion":2,"updatedFields":["guardian_name","household_size"],"rereadRequirements":false}}
```

**get_application_state**

request

```json
{"mode":"protected"}
```

response

```json
{"ok":true,"data":{"applicationRevision":4,"requirementsVersion":2,"stage":"draft","assistance":"allowed","activeFieldCount":8,"readyFieldCount":6,"blockerCount":2,"fields":[{"field":"legal_name","status":"ready","value":"Anaya Rao"},{"field":"student_id","status":"ready","value":"HZN-2026-0142"},{"field":"institution","status":"ready","value":"Northstar Community College"},{"field":"preferred_contact_email","status":"missing"},{"field":"dependency","status":"ready","value":true},{"field":"guardian_name","status":"ready","value":"Meera Rao"},{"field":"household_size","status":"ready","value":4},{"field":"annual_household_income","status":"needs_human_action"}],"safeActions":["use_visible_application"]}}
```

**apply_evidence_backed_answers**

request

```json
{"requestId":"6de6022d-cdcd-49b7-8056-2bd8df3434e6","expectedApplicationRevision":4,"expectedRequirementsVersion":2,"changes":[{"kind":"bind_claim","field":"annual_household_income","claimHandle":"hloC2FU0gcv0AhvOoopGlg"}]}
```

response

```json
{"ok":false,"error":{"code":"conflict_requires_human","message":"Income sources disagree. Resolve this in CiteApply.","safeActions":["resolve_in_visible_application"]}}
```

**get_application_state**

request

```json
{"mode":"protected"}
```

response

```json
{"ok":true,"data":{"applicationRevision":4,"requirementsVersion":2,"stage":"draft","assistance":"allowed","activeFieldCount":8,"readyFieldCount":6,"blockerCount":2,"fields":[{"field":"legal_name","status":"ready","value":"Anaya Rao"},{"field":"student_id","status":"ready","value":"HZN-2026-0142"},{"field":"institution","status":"ready","value":"Northstar Community College"},{"field":"preferred_contact_email","status":"missing"},{"field":"dependency","status":"ready","value":true},{"field":"guardian_name","status":"ready","value":"Meera Rao"},{"field":"household_size","status":"ready","value":4},{"field":"annual_household_income","status":"needs_human_action"}],"safeActions":["use_visible_application"]}}
```

**get_application_state**

request

```json
{"mode":"protected"}
```

response

```json
{"ok":true,"data":{"applicationRevision":4,"requirementsVersion":2,"stage":"draft","assistance":"allowed","activeFieldCount":8,"readyFieldCount":6,"blockerCount":2,"fields":[{"field":"legal_name","status":"ready","value":"Anaya Rao"},{"field":"student_id","status":"ready","value":"HZN-2026-0142"},{"field":"institution","status":"ready","value":"Northstar Community College"},{"field":"preferred_contact_email","status":"missing"},{"field":"dependency","status":"ready","value":true},{"field":"guardian_name","status":"ready","value":"Meera Rao"},{"field":"household_size","status":"ready","value":4},{"field":"annual_household_income","status":"needs_human_action"}],"safeActions":["use_visible_application"]}}
```

**apply_evidence_backed_answers**

request

```json
{"requestId":"3763a13f-3494-40e6-aba6-c6785bc5490e","expectedApplicationRevision":4,"expectedRequirementsVersion":2,"changes":[{"kind":"propose_email","field":"preferred_contact_email","value":"anaya.rao@example.test"}]}
```

response

```json
{"ok":true,"data":{"applicationRevision":5,"requirementsVersion":2,"updatedFields":["preferred_contact_email"],"rereadRequirements":false}}
```

**get_application_state**

request

```json
{"mode":"protected"}
```

response

```json
{"ok":true,"data":{"applicationRevision":5,"requirementsVersion":2,"stage":"draft","assistance":"allowed","activeFieldCount":8,"readyFieldCount":6,"blockerCount":2,"fields":[{"field":"legal_name","status":"ready","value":"Anaya Rao"},{"field":"student_id","status":"ready","value":"HZN-2026-0142"},{"field":"institution","status":"ready","value":"Northstar Community College"},{"field":"preferred_contact_email","status":"needs_declaration","value":"anaya.rao@example.test"},{"field":"dependency","status":"ready","value":true},{"field":"guardian_name","status":"ready","value":"Meera Rao"},{"field":"household_size","status":"ready","value":4},{"field":"annual_household_income","status":"needs_human_action"}],"safeActions":["use_visible_application"]}}
```

**prepare_submission_review**

request

```json
{"requestId":"ba750525-b765-4109-9541-ac1a2afbe971","expectedApplicationRevision":5,"expectedRequirementsVersion":2}
```

response

```json
{"ok":false,"error":{"code":"not_ready_for_review","message":"The application is not ready for Review.","safeActions":["use_visible_application"],"blockers":[{"code":"conflict_requires_human","field":"annual_household_income","message":"Income sources disagree. Resolve this in CiteApply.","action":"resolve_in_visible_application"},{"code":"declaration_required","field":"preferred_contact_email","message":"Declare the saved synthetic email in CiteApply.","action":"use_visible_application"}]}}
```

**get_application_state**

request

```json
{"mode":"protected"}
```

response

```json
{"ok":true,"data":{"applicationRevision":7,"requirementsVersion":2,"stage":"draft","assistance":"allowed","activeFieldCount":8,"readyFieldCount":8,"blockerCount":0,"fields":[{"field":"legal_name","status":"ready","value":"Anaya Rao"},{"field":"student_id","status":"ready","value":"HZN-2026-0142"},{"field":"institution","status":"ready","value":"Northstar Community College"},{"field":"preferred_contact_email","status":"ready","value":"anaya.rao@example.test","humanActionComplete":true},{"field":"dependency","status":"ready","value":true},{"field":"guardian_name","status":"ready","value":"Meera Rao"},{"field":"household_size","status":"ready","value":4},{"field":"annual_household_income","status":"ready","resolution":"human_completed","humanActionComplete":true}],"safeActions":["use_visible_application"]}}
```

**prepare_submission_review**

request

```json
{"requestId":"4ebc5360-e18c-4123-802f-9783f7b6c599","expectedApplicationRevision":7,"expectedRequirementsVersion":2}
```

response

```json
{"ok":true,"data":{"applicationRevision":8,"requirementsVersion":2,"readiness":"ready","reviewRef":"e-Ua0omji9V76UUmnSLjuN"}}
```

**get_application_state**

request

```json
{"mode":"protected"}
```

response

```json
{"ok":false,"error":{"code":"consent_required","message":"Use the visible CiteApply application to continue.","safeActions":["use_visible_application"]}}
```
