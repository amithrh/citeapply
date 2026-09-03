

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
{"ok":true,"data":{"documents":[{"code":"enrollment","title":"Synthetic Enrollment Record","documentClass":"synthetic_enrollment_record"},{"code":"household","title":"Synthetic Household Statement","documentClass":"synthetic_household_statement"},{"code":"income","title":"Synthetic Income Statement","documentClass":"synthetic_income_statement"}],"claims":[{"claimHandle":"FdexE3heamcfqGScK1b4Ww","page":1,"document":"enrollment","kind":"legal_name","normalizedValue":"Anaya Rao"},{"claimHandle":"fSBBiCkuW9jcuhNNknXeSQ","page":1,"document":"enrollment","kind":"student_id","normalizedValue":"HZN-2026-0142"},{"claimHandle":"qi7Oh69Ef4zhM0rejGe9HA","page":1,"document":"enrollment","kind":"institution","normalizedValue":"Northstar Community College"},{"claimHandle":"9zPOy8lxj7Hq8qGlW2PWwA","page":1,"document":"household","kind":"dependency","normalizedValue":true},{"claimHandle":"7l1w5thz-0rAqj1UsoslhQ","page":1,"document":"household","kind":"guardian_name","normalizedValue":"Meera Rao"},{"claimHandle":"Xb1XCzbPp4MCEt4aNLtzRg","page":1,"document":"household","kind":"household_size","normalizedValue":4},{"claimHandle":"xoHJZflg59WZa8_dWjHYxQ","page":1,"document":"household","kind":"annual_household_income","normalizedValue":480000},{"claimHandle":"UVWddNyJl_c5rBIYEcfh9A","page":1,"document":"income","kind":"annual_household_income","normalizedValue":480000}]}}
```

**apply_evidence_backed_answers**

request

```json
{"requestId":"c8d89264-05c0-4061-b7e0-190f27ba30a7","expectedApplicationRevision":2,"expectedRequirementsVersion":1,"changes":[{"kind":"bind_claim","field":"legal_name","claimHandle":"FdexE3heamcfqGScK1b4Ww"},{"kind":"bind_claim","field":"student_id","claimHandle":"fSBBiCkuW9jcuhNNknXeSQ"},{"kind":"bind_claim","field":"institution","claimHandle":"qi7Oh69Ef4zhM0rejGe9HA"},{"kind":"bind_claim","field":"dependency","claimHandle":"9zPOy8lxj7Hq8qGlW2PWwA"}]}
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
{"requestId":"16e27997-b7d1-4e07-aac8-04dc578894b7","expectedApplicationRevision":3,"expectedRequirementsVersion":2,"changes":[{"kind":"bind_claim","field":"guardian_name","claimHandle":"7l1w5thz-0rAqj1UsoslhQ"},{"kind":"bind_claim","field":"household_size","claimHandle":"Xb1XCzbPp4MCEt4aNLtzRg"}]}
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
{"requestId":"ad9b2e0d-c86d-47e0-9e37-5eeeb31ed5ca","expectedApplicationRevision":4,"expectedRequirementsVersion":2,"changes":[{"kind":"bind_claim","field":"annual_household_income","claimHandle":"UVWddNyJl_c5rBIYEcfh9A"}]}
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
{"requestId":"c5cbfe42-3f30-4890-ba61-5fc776cecb50","expectedApplicationRevision":5,"expectedRequirementsVersion":2,"changes":[{"kind":"propose_email","field":"preferred_contact_email","value":"anaya.rao@example.test"}]}
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
{"requestId":"fa7ccd22-4582-48ac-bd93-45fbc668d986","expectedApplicationRevision":6,"expectedRequirementsVersion":2}
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
{"requestId":"c034ea04-e58d-4296-9ae7-84671f9cfdc6","expectedApplicationRevision":7,"expectedRequirementsVersion":2}
```

response

```json
{"ok":true,"data":{"applicationRevision":8,"requirementsVersion":2,"readiness":"ready","reviewRef":"t7tRuS_Uqzadn5Nro5NiCt"}}
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
{"ok":true,"data":{"documents":[{"code":"enrollment","title":"Synthetic Enrollment Record","documentClass":"synthetic_enrollment_record"},{"code":"household","title":"Synthetic Household Statement","documentClass":"synthetic_household_statement"},{"code":"income","title":"Synthetic Income Statement","documentClass":"synthetic_income_statement"}],"claims":[{"claimHandle":"bCeDsMoA21x2NQt3munjbQ","page":1,"document":"enrollment","kind":"legal_name","normalizedValue":"Anaya Rao"},{"claimHandle":"TPCwIq11aMrlvCMJwQ6Ofg","page":1,"document":"enrollment","kind":"student_id","normalizedValue":"HZN-2026-0142"},{"claimHandle":"FH4Dg7HZ0ahfqxy3h80t4w","page":1,"document":"enrollment","kind":"institution","normalizedValue":"Northstar Community College"},{"claimHandle":"8rWYKXXLjIQfxIWdm6rfdg","page":1,"document":"household","kind":"dependency","normalizedValue":true},{"claimHandle":"eeDk1QPiUIOJ3eBnCdWcRA","page":1,"document":"household","kind":"guardian_name","normalizedValue":"Meera Rao"},{"claimHandle":"10bOvmme4pWc56054WqPYQ","page":1,"document":"household","kind":"household_size","normalizedValue":4},{"claimHandle":"FHMRWmJ6f1bb5O2vgTieEA","page":1,"document":"household","kind":"annual_household_income","normalizedValue":480000},{"claimHandle":"pyUidZeIfx9II6L_EVvTLg","page":1,"document":"income","kind":"annual_household_income","normalizedValue":540000}]}}
```

**apply_evidence_backed_answers**

request

```json
{"requestId":"fcae2bc2-bb51-4761-9a8e-9984622f38b5","expectedApplicationRevision":2,"expectedRequirementsVersion":1,"changes":[{"kind":"bind_claim","field":"legal_name","claimHandle":"bCeDsMoA21x2NQt3munjbQ"},{"kind":"bind_claim","field":"student_id","claimHandle":"TPCwIq11aMrlvCMJwQ6Ofg"},{"kind":"bind_claim","field":"institution","claimHandle":"FH4Dg7HZ0ahfqxy3h80t4w"},{"kind":"bind_claim","field":"dependency","claimHandle":"8rWYKXXLjIQfxIWdm6rfdg"}]}
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
{"requestId":"c0809ffa-0e45-4714-9177-b814214aef16","expectedApplicationRevision":3,"expectedRequirementsVersion":2,"changes":[{"kind":"bind_claim","field":"guardian_name","claimHandle":"eeDk1QPiUIOJ3eBnCdWcRA"},{"kind":"bind_claim","field":"household_size","claimHandle":"10bOvmme4pWc56054WqPYQ"}]}
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
{"requestId":"cea88553-3b3a-4570-b6a3-00471c74f078","expectedApplicationRevision":4,"expectedRequirementsVersion":2,"changes":[{"kind":"bind_claim","field":"annual_household_income","claimHandle":"pyUidZeIfx9II6L_EVvTLg"}]}
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
{"requestId":"035e90fd-5c0c-43a0-b714-b262f64da4f7","expectedApplicationRevision":4,"expectedRequirementsVersion":2,"changes":[{"kind":"propose_email","field":"preferred_contact_email","value":"anaya.rao@example.test"}]}
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
{"requestId":"e5cce1eb-328f-459d-84ec-fc0d1e574c85","expectedApplicationRevision":5,"expectedRequirementsVersion":2}
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
{"requestId":"51b1ffa3-e551-4aff-8911-7f18281fe9be","expectedApplicationRevision":7,"expectedRequirementsVersion":2}
```

response

```json
{"ok":true,"data":{"applicationRevision":8,"requirementsVersion":2,"readiness":"ready","reviewRef":"t47q48wawPb_TTmcKPhM0A"}}
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
