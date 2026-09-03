

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
{"ok":true,"data":{"documents":[{"code":"enrollment","title":"Synthetic Enrollment Record","documentClass":"synthetic_enrollment_record"},{"code":"household","title":"Synthetic Household Statement","documentClass":"synthetic_household_statement"},{"code":"income","title":"Synthetic Income Statement","documentClass":"synthetic_income_statement"}],"claims":[{"claimHandle":"Ny4av5bbuixcSdu-FoGvIA","page":1,"document":"enrollment","kind":"legal_name","normalizedValue":"Anaya Rao"},{"claimHandle":"MU8BkNi86Gg6GYNUNqFI3w","page":1,"document":"enrollment","kind":"student_id","normalizedValue":"HZN-2026-0142"},{"claimHandle":"i27YY2O4WSKaaO6WgTEZHg","page":1,"document":"enrollment","kind":"institution","normalizedValue":"Northstar Community College"},{"claimHandle":"p1Cqxylo00zdR4fwi81JpQ","page":1,"document":"household","kind":"dependency","normalizedValue":true},{"claimHandle":"h-SBkeiQsYCig4xocQgGdQ","page":1,"document":"household","kind":"guardian_name","normalizedValue":"Meera Rao"},{"claimHandle":"Y3yoRBRJ1BE74ZTqEzXxRg","page":1,"document":"household","kind":"household_size","normalizedValue":4},{"claimHandle":"OI01mJ6p___YmiFRPFRXvQ","page":1,"document":"household","kind":"annual_household_income","normalizedValue":480000},{"claimHandle":"ub46vIMahO08suZujM0P0g","page":1,"document":"income","kind":"annual_household_income","normalizedValue":480000}]}}
```

**apply_evidence_backed_answers**

request

```json
{"requestId":"86cd2df9-cc7b-4792-9e42-3c3fc3646856","expectedApplicationRevision":2,"expectedRequirementsVersion":1,"changes":[{"kind":"bind_claim","field":"legal_name","claimHandle":"Ny4av5bbuixcSdu-FoGvIA"},{"kind":"bind_claim","field":"student_id","claimHandle":"MU8BkNi86Gg6GYNUNqFI3w"},{"kind":"bind_claim","field":"institution","claimHandle":"i27YY2O4WSKaaO6WgTEZHg"},{"kind":"bind_claim","field":"dependency","claimHandle":"p1Cqxylo00zdR4fwi81JpQ"}]}
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
{"requestId":"75f7335f-51fb-47e4-aabb-c8521c46bb2b","expectedApplicationRevision":3,"expectedRequirementsVersion":2,"changes":[{"kind":"bind_claim","field":"guardian_name","claimHandle":"h-SBkeiQsYCig4xocQgGdQ"},{"kind":"bind_claim","field":"household_size","claimHandle":"Y3yoRBRJ1BE74ZTqEzXxRg"}]}
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
{"requestId":"81ebe3ee-feac-4358-8853-11cc897b4684","expectedApplicationRevision":4,"expectedRequirementsVersion":2,"changes":[{"kind":"bind_claim","field":"annual_household_income","claimHandle":"ub46vIMahO08suZujM0P0g"}]}
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
{"requestId":"dad15329-8366-4236-aabc-ce7aa493bd2b","expectedApplicationRevision":5,"expectedRequirementsVersion":2,"changes":[{"kind":"propose_email","field":"preferred_contact_email","value":"anaya.rao@example.test"}]}
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
{"requestId":"3b8ce9db-85e8-4386-af0e-444776ffb033","expectedApplicationRevision":6,"expectedRequirementsVersion":2}
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
{"requestId":"17761e09-3bc2-451c-9009-fabe412969f7","expectedApplicationRevision":7,"expectedRequirementsVersion":2}
```

response

```json
{"ok":true,"data":{"applicationRevision":8,"requirementsVersion":2,"readiness":"ready","reviewRef":"nOETID94_XOzWHPe5nMfHq"}}
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
{"ok":true,"data":{"documents":[{"code":"enrollment","title":"Synthetic Enrollment Record","documentClass":"synthetic_enrollment_record"},{"code":"household","title":"Synthetic Household Statement","documentClass":"synthetic_household_statement"},{"code":"income","title":"Synthetic Income Statement","documentClass":"synthetic_income_statement"}],"claims":[{"claimHandle":"w6xyUxRhZJFpwg1fQWLZuQ","page":1,"document":"enrollment","kind":"legal_name","normalizedValue":"Anaya Rao"},{"claimHandle":"lSJQ_dE9jeVlVVwGOB9Z6A","page":1,"document":"enrollment","kind":"student_id","normalizedValue":"HZN-2026-0142"},{"claimHandle":"USj75R44G1mIkpWbusUGKg","page":1,"document":"enrollment","kind":"institution","normalizedValue":"Northstar Community College"},{"claimHandle":"knxAT0i682145VGxaF8Okw","page":1,"document":"household","kind":"dependency","normalizedValue":true},{"claimHandle":"FAybFeZJyph5a3rDf17GrA","page":1,"document":"household","kind":"guardian_name","normalizedValue":"Meera Rao"},{"claimHandle":"p0Lvq2vpjAWorcYNZVUF3g","page":1,"document":"household","kind":"household_size","normalizedValue":4},{"claimHandle":"E9H0ROMBnbgR8YjZttjLLA","page":1,"document":"household","kind":"annual_household_income","normalizedValue":480000},{"claimHandle":"yQIFuT4y-Z013EgV983GSA","page":1,"document":"income","kind":"annual_household_income","normalizedValue":540000}]}}
```

**apply_evidence_backed_answers**

request

```json
{"requestId":"23e56691-1579-4ea1-a635-6135ee4486de","expectedApplicationRevision":2,"expectedRequirementsVersion":1,"changes":[{"kind":"bind_claim","field":"legal_name","claimHandle":"w6xyUxRhZJFpwg1fQWLZuQ"},{"kind":"bind_claim","field":"student_id","claimHandle":"lSJQ_dE9jeVlVVwGOB9Z6A"},{"kind":"bind_claim","field":"institution","claimHandle":"USj75R44G1mIkpWbusUGKg"},{"kind":"bind_claim","field":"dependency","claimHandle":"knxAT0i682145VGxaF8Okw"}]}
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
{"requestId":"27e97a0f-53d6-466c-9b54-403a7dd7e7aa","expectedApplicationRevision":3,"expectedRequirementsVersion":2,"changes":[{"kind":"bind_claim","field":"guardian_name","claimHandle":"FAybFeZJyph5a3rDf17GrA"},{"kind":"bind_claim","field":"household_size","claimHandle":"p0Lvq2vpjAWorcYNZVUF3g"}]}
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
{"requestId":"0e9f99a9-5bb8-40a6-bfbc-24482e36a816","expectedApplicationRevision":4,"expectedRequirementsVersion":2,"changes":[{"kind":"bind_claim","field":"annual_household_income","claimHandle":"yQIFuT4y-Z013EgV983GSA"}]}
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
{"requestId":"e4ee86e5-6fa1-4bf9-afdc-2e677fd92e42","expectedApplicationRevision":4,"expectedRequirementsVersion":2,"changes":[{"kind":"propose_email","field":"preferred_contact_email","value":"anaya.rao@example.test"}]}
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
{"requestId":"fe544d38-7cbd-48df-b9ec-2278e6b7170e","expectedApplicationRevision":5,"expectedRequirementsVersion":2}
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
{"requestId":"1c6503a3-82e6-476f-9c33-4cd9a631f5bd","expectedApplicationRevision":7,"expectedRequirementsVersion":2}
```

response

```json
{"ok":true,"data":{"applicationRevision":8,"requirementsVersion":2,"readiness":"ready","reviewRef":"C1fPavgU_BefajqYCNcLVi"}}
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
