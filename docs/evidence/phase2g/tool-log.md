

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
{"ok":true,"data":{"documents":[{"code":"enrollment","title":"Synthetic Enrollment Record","documentClass":"synthetic_enrollment_record"},{"code":"household","title":"Synthetic Household Statement","documentClass":"synthetic_household_statement"},{"code":"income","title":"Synthetic Income Statement","documentClass":"synthetic_income_statement"}],"claims":[{"claimHandle":"62m1qF2rpCOatyG6vIyEfg","page":1,"document":"enrollment","kind":"legal_name","normalizedValue":"Anaya Rao"},{"claimHandle":"jnnA_4RZiujIPjz4Vkxawg","page":1,"document":"enrollment","kind":"student_id","normalizedValue":"HZN-2026-0142"},{"claimHandle":"cUMK1JCKK_bFM2wMXXedqQ","page":1,"document":"enrollment","kind":"institution","normalizedValue":"Northstar Community College"},{"claimHandle":"yg7FoXX401q4a2PFa8oLYQ","page":1,"document":"household","kind":"dependency","normalizedValue":true},{"claimHandle":"6KaQ_l702hZZ4_pXE3nC6A","page":1,"document":"household","kind":"guardian_name","normalizedValue":"Meera Rao"},{"claimHandle":"BqkSxTnR2s0DwhNOdcyDKg","page":1,"document":"household","kind":"household_size","normalizedValue":4},{"claimHandle":"HZvzVdlVOZGUwBc-Jnt_og","page":1,"document":"household","kind":"annual_household_income","normalizedValue":480000},{"claimHandle":"2D__8tYi4LtuNis1FgKX3g","page":1,"document":"income","kind":"annual_household_income","normalizedValue":480000}]}}
```

**apply_evidence_backed_answers**

request

```json
{"requestId":"917add54-0d79-4448-9c3b-a608a7e2cb63","expectedApplicationRevision":2,"expectedRequirementsVersion":1,"changes":[{"kind":"bind_claim","field":"legal_name","claimHandle":"62m1qF2rpCOatyG6vIyEfg"},{"kind":"bind_claim","field":"student_id","claimHandle":"jnnA_4RZiujIPjz4Vkxawg"},{"kind":"bind_claim","field":"institution","claimHandle":"cUMK1JCKK_bFM2wMXXedqQ"},{"kind":"bind_claim","field":"dependency","claimHandle":"yg7FoXX401q4a2PFa8oLYQ"}]}
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
{"requestId":"7a5513ac-dc6c-4cfe-9d46-e6bb3d136725","expectedApplicationRevision":3,"expectedRequirementsVersion":2,"changes":[{"kind":"bind_claim","field":"guardian_name","claimHandle":"6KaQ_l702hZZ4_pXE3nC6A"},{"kind":"bind_claim","field":"household_size","claimHandle":"BqkSxTnR2s0DwhNOdcyDKg"}]}
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
{"requestId":"e550ade6-6f56-41a7-8ea7-8859c4a37a03","expectedApplicationRevision":4,"expectedRequirementsVersion":2,"changes":[{"kind":"bind_claim","field":"annual_household_income","claimHandle":"2D__8tYi4LtuNis1FgKX3g"}]}
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
{"requestId":"b4a930ac-e44e-4d6d-8822-106f51997ed3","expectedApplicationRevision":5,"expectedRequirementsVersion":2,"changes":[{"kind":"propose_email","field":"preferred_contact_email","value":"anaya.rao@example.test"}]}
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
{"requestId":"71dcefc5-4114-46e1-8de8-69e692112d3d","expectedApplicationRevision":6,"expectedRequirementsVersion":2}
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
{"requestId":"bd635905-e2ad-41a9-9733-3fa8065fa25f","expectedApplicationRevision":7,"expectedRequirementsVersion":2}
```

response

```json
{"ok":true,"data":{"applicationRevision":8,"requirementsVersion":2,"readiness":"ready","reviewRef":"Vagfx4Oyg5uMKrWC-tFnBF"}}
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
{"ok":true,"data":{"documents":[{"code":"enrollment","title":"Synthetic Enrollment Record","documentClass":"synthetic_enrollment_record"},{"code":"household","title":"Synthetic Household Statement","documentClass":"synthetic_household_statement"},{"code":"income","title":"Synthetic Income Statement","documentClass":"synthetic_income_statement"}],"claims":[{"claimHandle":"XL5sBDnEXg_Mi62jNUTLfA","page":1,"document":"enrollment","kind":"legal_name","normalizedValue":"Anaya Rao"},{"claimHandle":"-7bdZC_rF1mHR5i8Ez2RMg","page":1,"document":"enrollment","kind":"student_id","normalizedValue":"HZN-2026-0142"},{"claimHandle":"q05uqkLWMVI3V9mUm7LZXg","page":1,"document":"enrollment","kind":"institution","normalizedValue":"Northstar Community College"},{"claimHandle":"xJ2RVsDGCrE4p0Iai_IkZg","page":1,"document":"household","kind":"dependency","normalizedValue":true},{"claimHandle":"ZKxtbBeZuPZQ06B5LSk_7g","page":1,"document":"household","kind":"guardian_name","normalizedValue":"Meera Rao"},{"claimHandle":"6AuEg9W0FdTKEVcepXDLXA","page":1,"document":"household","kind":"household_size","normalizedValue":4},{"claimHandle":"l9sD2tsiJ4FDXtbs4UM_LA","page":1,"document":"household","kind":"annual_household_income","normalizedValue":480000},{"claimHandle":"5x-eInn5m0b10SeefZ0FqA","page":1,"document":"income","kind":"annual_household_income","normalizedValue":540000}]}}
```

**apply_evidence_backed_answers**

request

```json
{"requestId":"ac137cec-fb7f-4224-b7b7-9c4b393dad3d","expectedApplicationRevision":2,"expectedRequirementsVersion":1,"changes":[{"kind":"bind_claim","field":"legal_name","claimHandle":"XL5sBDnEXg_Mi62jNUTLfA"},{"kind":"bind_claim","field":"student_id","claimHandle":"-7bdZC_rF1mHR5i8Ez2RMg"},{"kind":"bind_claim","field":"institution","claimHandle":"q05uqkLWMVI3V9mUm7LZXg"},{"kind":"bind_claim","field":"dependency","claimHandle":"xJ2RVsDGCrE4p0Iai_IkZg"}]}
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
{"requestId":"9c7c0a75-bfe0-4a95-86b1-dc974c1c64d2","expectedApplicationRevision":3,"expectedRequirementsVersion":2,"changes":[{"kind":"bind_claim","field":"guardian_name","claimHandle":"ZKxtbBeZuPZQ06B5LSk_7g"},{"kind":"bind_claim","field":"household_size","claimHandle":"6AuEg9W0FdTKEVcepXDLXA"}]}
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
{"requestId":"0cbdfc96-8eb3-41e0-87cf-b2d567959ec5","expectedApplicationRevision":4,"expectedRequirementsVersion":2,"changes":[{"kind":"bind_claim","field":"annual_household_income","claimHandle":"5x-eInn5m0b10SeefZ0FqA"}]}
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
{"requestId":"98e61017-5839-498b-951e-90e54ee12313","expectedApplicationRevision":4,"expectedRequirementsVersion":2,"changes":[{"kind":"propose_email","field":"preferred_contact_email","value":"anaya.rao@example.test"}]}
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
{"requestId":"85acca34-542c-45e6-83d7-29ee33478b5b","expectedApplicationRevision":5,"expectedRequirementsVersion":2}
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
{"requestId":"f1a1a3c1-4b33-4279-ae9c-1d43f2ca0959","expectedApplicationRevision":7,"expectedRequirementsVersion":2}
```

response

```json
{"ok":true,"data":{"applicationRevision":8,"requirementsVersion":2,"readiness":"ready","reviewRef":"i5tw583-c1CEO_twITco9J"}}
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
