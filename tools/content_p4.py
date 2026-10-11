"""Phase 4 learning content: lessons 12 to 17, missions 21 to 28, quiz topics and glossary."""
import json
import os

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
P = lambda *x: os.path.join(ROOT, 'src', 'data', *x)


def load(name):
    with open(P(name), encoding='utf-8') as f:
        return json.load(f)


def save(obj, name):
    with open(P(name), 'w', encoding='utf-8') as f:
        json.dump(obj, f, ensure_ascii=False, indent=1)
        f.write('\n')


LESSONS = [
    {'id': 12, 'topic': 'canada', 'region': 'ca', 'section': 'intl', 'title': 'Post-NOC changes in Canada', 'minutes': 6, 'tryChange': 'dp-site-move', 'sections': [
        {'h': 'Four levels', 'p': [
            'Health Canada sorts changes after the Notice of Compliance (NOC) into four levels. Level I is a supplement (an SNDS, or SANDS for a generic): implement only after a new NOC. Level II has two kinds: a supplement for safety labelling, and a notifiable change for biologics, implemented after a No Objection Letter. Level III is a notice of change: implement, then tell Health Canada. Level IV is a record kept under GMP.',
            'For pharmaceuticals there is no notifiable change: the 2019 revision of the quality guidance moved those changes to Level I or Level III.']},
        {'h': 'Conditions decide', 'p': [
            'Appendix 1 of the quality guidance lists each change with conditions. When every condition for Level III is met the change is a notice; if one is not met, it moves up to the next level. A series of small changes can together justify a higher level.',
            'Pharmaceutical Level III changes are best filed at implementation; biologics file them within 12 months. Biologics also have an immediate notification, from 21 days before to 14 days after implementation, mostly through an approved protocol.']},
        {'h': 'ICH Q12 in Canada', 'p': [
            'Health Canada starts with protocols (PACMPs) for biologic and radiopharmaceutical products: submissions are accepted after a 90-day period that began on 13 August 2026. Established conditions are not implemented yet, and pharmaceutical protocols follow later.']},
    ]},
    {'id': 13, 'topic': 'switzerland', 'region': 'ch', 'section': 'intl', 'title': 'Switzerland: the EU list, Swiss clocks', 'minutes': 5, 'tryChange': 'shelf-life-extend', 'sections': [
        {'h': 'One list, harmonised', 'p': [
            'Since 1 February 2026 Swissmedic classifies variations with a revised list in Annex 7 of the TPLRO, harmonised as far as possible with the EU list. The codes (for example Q.II.b.1) and most conditions are the same, so an EU classification is a good start.',
            'Swiss-only variations are numbered from 100, and the variation form valid from 1 February 2026 must be used.']},
        {'h': 'Where Switzerland differs', 'p': [
            'Type IA-IN is notified within one month after implementation, not immediately. Type IB is accepted if Swissmedic does not object within 70 days (10 days formal control and 60 days evaluation). Type II has time limits up to 270 days of Swissmedic time, plus the applicant\'s time to answer.',
            'There is no EU worksharing, and the holder must be established in Switzerland. Several variations for one product form a multiple application, processed on the longest time limit; safety-related variations cannot be part of one.']},
    ]},
    {'id': 14, 'topic': 'japan', 'region': 'jp', 'section': 'intl', 'title': 'Japan: the approval form decides', 'minutes': 6, 'tryChange': 'dp-scale', 'sections': [
        {'h': 'No list of change types', 'p': [
            'Japan does not classify changes from a list. The approval form, with its approved matters, is legally binding. Changing an approved matter needs a partial change approval. Items the form marks as minor change items are notified within 30 days after the change. Items outside the form need no filing.',
            'Article 47 of the Enforcement Regulations keeps some changes out of the minor route whatever the form says: changes that affect the nature or safety of the product, deleting or changing specifications, pathogen inactivation, and dosage or indications.']},
        {'h': 'Faster routes', 'p': [
            'A site change with an unchanged method can go through a rapid partial change review (about 3 months). Since 2024 a trial lets designated moderate change items use a short review, and since 2025 another trial lets designated low-impact items be reported once a year.',
            'Change plans (Japan\'s PACMP) have two steps: confirm the plan, then notify each change made under it. The change becomes an approved matter 40 working days after acceptance (20 in special cases).']},
    ]},
    {'id': 15, 'topic': 'who', 'region': 'who', 'section': 'intl', 'title': 'WHO prequalification variations', 'minutes': 5, 'tryChange': 'dp-scale', 'sections': [
        {'h': 'Four categories', 'p': [
            'Variations to prequalified finished products follow WHO TRS 981 Annex 3. An annual notification is made within 12 months of implementation. An immediate notification is made as the change is implemented. A minor variation can be implemented if WHO has not started correspondence within 60 days of acknowledging it. A major variation needs WHO\'s letter of acceptance first.',
            'Some changes, such as a new strength, dosage form or route, need a new application.']},
        {'h': 'Practical points', 'p': [
            'The timeline table published by PQT prevails over the guideline. A change that is not listed is major by default, unless it is justified as an unclassified minor variation (suffix u) or agreed with PQT in advance.',
            'A new manufacturing site is minor only if WHO or a stringent authority inspected it in the last three years. Adding nitrosamine controls is an immediate notification. Grouping is allowed for consequential changes, the same change to several products, or annual notifications.']},
    ]},
    {'id': 16, 'topic': 'q12', 'region': 'us', 'section': 'lifecycle', 'title': 'Established conditions, PACMPs and the PLCM document', 'minutes': 7, 'tryChange': 'non-ec-change', 'sections': [
        {'h': 'Established conditions', 'p': [
            'ICH Q12 splits the quality dossier into established conditions (ECs), which are legally binding, and supportive information. Only a change to an EC needs a regulatory submission; everything else is managed in the quality system.',
            'Each EC gets a reporting category by risk: prior approval for high risk, a moderate notification for medium risk and a low notification for low risk. Better process knowledge (an enhanced or performance-based approach) can mean fewer ECs or lower categories.']},
        {'h': 'Protocols and the PLCM document', 'p': [
            'A post-approval change management protocol (PACMP) agrees a change in advance in two steps: the plan with its studies and acceptance criteria, then the change itself, reported in a lower category.',
            'The product lifecycle management (PLCM) document lists the ECs with their categories, the protocols and the post-approval CMC commitments. The Lifecycle page builds all three for a fictional product and maps each category to the US, EU, Swiss and Japanese routes.']},
    ]},
    {'id': 17, 'topic': 'q5e', 'region': 'eu', 'section': 'lifecycle', 'title': 'Comparability after a biologic process change (ICH Q5E)', 'minutes': 6, 'tryChange': 'bio-scale', 'sections': [
        {'h': 'Highly similar, no adverse impact', 'p': [
            'After a manufacturing change to a biological product, the holder shows that the product before and after is highly similar, and that any difference has no adverse impact on safety or efficacy. The products need not be identical.',
            'The exercise compares physicochemical properties, biological activity, purity and impurities, and stability, guided by a risk assessment of what the change could affect. Accelerated and stress studies often show subtle differences that release tests miss.']},
        {'h': 'When quality data are not enough', 'p': [
            'If quality data cannot rule out an impact (for example a changed glycosylation profile that could affect exposure), nonclinical or clinical bridging studies may be needed.',
            'In the classifier, changes that need a comparability assessment are classified more strictly; in the EU a batch size change for a biological substance that needs one is Type II (Q.I.a.3(c)).']},
    ]},
]

MISSIONS = [
    {'id': 21, 'region': 'ca', 'title': 'A second tablet site for Canada', 'product': 'nce-tablet', 'submitDate': '2026-11-16', 'timeline': 'notify',
     'brief': 'Halcyon Ridge adds a second site to make Ostrevia tablets for Canada. The site holds a Canadian establishment licence listing, uses the same process and equipment class, has completed process validation, and no specification changes. Ostrevia is not sterile. The change is implemented on 16 November 2026.',
     'goal': 'Classify the change under Health Canada\'s quality guidance, list the sections and give the date the Level III form should be filed.',
     'changes': [{'changeId': 'dp-site-move', 'note': 'Second drug product site', 'facts': {'HC-A1.23:1': 'yes', 'HC-A1.23:2': 'yes', 'HC-A1.23:3': 'yes', 'HC-A1.23:4': 'yes', 'HC-A1.23:5': 'yes'}}],
     'debrief': 'Every condition for Level III is met, so the site change is a Level III notice of change. For pharmaceutical quality changes Health Canada recommends filing the Level III form at implementation, so the date is the implementation date. If one condition failed, the change would move up to a Level I supplement.'},
    {'id': 22, 'region': 'ca', 'title': 'Biologic: a wider specification limit', 'product': 'mab-infusion', 'submitDate': '2026-11-23', 'timeline': 'earliestUse',
     'brief': 'Lumenfield wants to widen the acceptance criterion for charge variants of Arventa drug substance, based on clinical experience. The filing goes to Health Canada on 23 November 2026.',
     'goal': 'Classify the change for a biologic in Canada and give the earliest date of use if Health Canada meets its review target.',
     'changes': [{'changeId': 'spec-relax', 'note': 'Wider acceptance criterion for charge variants', 'facts': {}}],
     'debrief': 'For biologics, relaxing an acceptance criterion is a Level II notifiable change (quality guidance for biologics, Table 25f). Health Canada\'s review target is 90 days, after which it issues a No Objection Letter. Pharmaceuticals have no notifiable change: there, relaxing a limit is a Level I supplement unless it matches compendial or ICH criteria.'},
    {'id': 23, 'region': 'ch', 'title': 'Swiss shelf life for an injection', 'product': 'sterile-injectable', 'submitDate': '2026-11-30', 'timeline': 'earliestUse',
     'brief': 'Meridale has 36 months of real-time data, under the approved protocol, supporting a longer shelf life for Nelvaprox vials in Switzerland. All batches meet the specification and there are no unexpected trends. The notification goes to Swissmedic on 30 November 2026.',
     'goal': 'Classify the change on the Swiss list, list the sections and give the earliest implementation date.',
     'changes': [{'changeId': 'shelf-life-extend', 'note': 'Shelf life from 24 to 36 months', 'facts': {'realTimeData': 'yes', 'Q.II.f.1:3': 'yes'}}],
     'debrief': 'The Swiss list follows the EU: a real-time extension is Type IA-IN only for an immediate-release film-coated tablet. Nelvaprox is a solution for injection, so it is Type IB. In Switzerland a Type IB is accepted if Swissmedic does not object within 70 days, not 30 as in the EU.'},
    {'id': 24, 'region': 'ch', 'title': 'A new company name in Switzerland', 'product': 'nce-tablet', 'submitDate': '2026-12-01', 'timeline': 'notify',
     'brief': 'Halcyon Ridge Pharma (Schweiz) AG renames itself on 1 December 2026. It stays the same legal entity at the same address.',
     'goal': 'Classify the change and give the latest date to notify Swissmedic.',
     'changes': [{'changeId': 'admin-name-address', 'note': 'New company name, same legal entity', 'facts': {'E.4:1': 'yes'}}],
     'debrief': 'A new name for the same legal entity is Type IA-IN (E.4(a)). In the EU that means notifying immediately; in Switzerland a Type IA-IN is notified no later than one month after implementation (Swissmedic Q&A 1.3).'},
    {'id': 25, 'region': 'jp', 'title': 'Japan: a batch size marked as minor', 'product': 'nce-tablet', 'submitDate': '2026-12-07', 'timeline': 'notify',
     'brief': 'Halcyon Ridge Japan increases the Ostrevia batch size from 300,000 to 600,000 tablets with the same equipment. In the approval form, the batch size is written as a minor change item. The change is made on 7 December 2026.',
     'goal': 'Classify the change in Japan and give the latest date to file.',
     'changes': [{'changeId': 'dp-scale', 'note': 'Batch size 300,000 to 600,000 tablets', 'facts': {'jpItem': 'minor'}}],
     'debrief': 'The approval form decides: the batch size is a minor change item, so the change is a minor change notification, filed within 30 days after the change. Had the batch size been written as an approved matter, it would need a partial change approval.'},
    {'id': 26, 'region': 'jp', 'title': 'Japan: a wider dissolution limit', 'product': 'nce-tablet', 'submitDate': '2026-12-14', 'timeline': 'earliestUse',
     'brief': 'Halcyon Ridge Japan wants to widen the dissolution acceptance criterion of Ostrevia. A colleague points out that the specification line is marked as a minor change item in the approval form. The application goes in on 14 December 2026.',
     'goal': 'Classify the change and give the date to plan around (the typical review time from the 2023 survey).',
     'changes': [{'changeId': 'spec-relax', 'note': 'Dissolution Q from 80% to 75% at 30 minutes', 'facts': {'jpItem': 'minor'}}],
     'debrief': 'Article 47(2) of the Enforcement Regulations excludes deleting or changing specifications from the minor route, whatever the form marks. The change needs a partial change approval. The 2023 MHLW survey found a median of about 6 months for chemical drugs; it is not a target.'},
    {'id': 27, 'region': 'who', 'title': 'WHO PQ: a second manufacturing site', 'product': 'pq-antimalarial', 'submitDate': '2026-12-01', 'timeline': 'earliestUse',
     'brief': 'Sunpath adds a second site for manufacturing Malvaren dispersible tablets. A stringent regulatory authority inspected the site 18 months ago with a satisfactory outcome. The variation goes to PQT on 1 December 2026.',
     'goal': 'Classify the change under the WHO guideline and give the earliest implementation date.',
     'changes': [{'changeId': 'dp-site-move', 'note': 'Second manufacturing site, Unit III', 'facts': {'pqInspected': 'yes'}}],
     'debrief': 'A new manufacturing site inspected by WHO or a stringent authority in the last three years is a minor variation (28c). WHO acknowledges within 7 days; the change can be implemented if WHO has not started correspondence within 60 days of the acknowledgement. Without a recent inspection the change would be major.'},
    {'id': 28, 'region': 'who', 'title': 'WHO PQ: nitrosamines and a tighter limit', 'product': 'pq-antimalarial', 'submitDate': '2026-12-08', 'timeline': 'earliestUse', 'related': False,
     'brief': 'After a nitrosamine risk assessment, Sunpath adds an NDSRI test and limit to the Malvaren specification on 8 December 2026. Separately, it tightens the limit for water content. The two changes are not related.',
     'goal': 'Classify both changes, plan the filings and give the earliest date for the main filing.',
     'changes': [{'changeId': 'nitrosamine-control', 'note': 'NDSRI test and limit', 'facts': {}}, {'changeId': 'spec-tighten', 'note': 'Water content from 5.0% to 4.0%', 'facts': {}}],
     'debrief': 'PQT asks for nitrosamine controls as an immediate notification, with a declaration on nitrosamine risk; the change is implemented as it is notified. Tightening an FPP limit is an annual notification (37c), which goes in the yearly group. The main filing is the immediate notification.'},
]

QUIZ_TOPICS = [
    {'id': 'canada', 'label': 'Canada'}, {'id': 'switzerland', 'label': 'Switzerland'}, {'id': 'japan', 'label': 'Japan'},
    {'id': 'who', 'label': 'WHO prequalification'}, {'id': 'q12', 'label': 'ICH Q12 lifecycle tools'}, {'id': 'q5e', 'label': 'ICH Q5E comparability'},
]
Q = lambda id, topic, q, options, answer, why, cite: {'id': id, 'topic': topic, 'q': q, 'options': options, 'answer': answer, 'why': why, 'cite': cite}
QUIZ = [
    Q('c1', 'canada', 'In Canada, which level is a supplement that needs a new Notice of Compliance before implementation?', ['Level I', 'Level II', 'Level III', 'Level IV'], 0, 'Level I changes are filed as an SNDS or SANDS and may not be implemented until a NOC is issued.', 'Post-NOC Framework, 2.1.1'),
    Q('c2', 'canada', 'For which products does Health Canada use the Level II notifiable change for quality changes?', ['Biologics and radiopharmaceuticals', 'All drugs', 'Pharmaceuticals only', 'Generics only'], 0, 'Notifiable changes apply only to biologic and radiopharmaceutical quality changes; for pharmaceuticals they were moved to Level I or III.', 'Post-NOC Framework, 2.1.3'),
    Q('c3', 'canada', 'A condition for a Level III change is not met. What happens?', ['The change moves to the next higher level', 'It stays Level III with a justification', 'It becomes Level IV', 'Health Canada decides after implementation'], 0, 'If a condition is not met, the change is automatically the next higher level.', 'Quality guidance, 3.1'),
    Q('c4', 'canada', 'When are Level III changes for biologics reported?', ['Within 12 months of implementation', 'Before implementation', 'Within 30 days', 'Only on request'], 0, 'Biologics report Level III annual notifications within 12 months of implementing the change.', 'Framework for biologics (2026)'),
    Q('c5', 'canada', 'What is the review target for a notifiable change?', ['90 days', '30 days', '180 days', '300 days'], 0, 'Notifiable changes have a 90-day review target, ending with a No Objection Letter.', 'Performance standards'),
    Q('s1', 'switzerland', 'From 1 February 2026, Swissmedic\'s list of variations is:', ['Harmonised as far as possible with the EU list', 'Identical to the FDA guidance', 'Replaced by case-by-case review', 'Only for biologics'], 0, 'Annex 7 TPLRO was revised and harmonised as far as possible with the EU list.', 'Swissmedic, revised Annex 7'),
    Q('s2', 'switzerland', 'How soon after implementation is a Swiss Type IA-IN notified?', ['No later than one month', 'Immediately', 'Within 12 months', 'Before implementation'], 0, 'Swissmedic Q&A 1.3: Type IA-IN is notified no later than one month after implementation.', 'Swissmedic Q&A 1.3'),
    Q('s3', 'switzerland', 'After how many days is a Swiss Type IB accepted if Swissmedic does not object?', ['70', '30', '60', '90'], 0, '10 days formal control plus 60 days evaluation: 70 days.', 'Time limits guidance, Annex 6.4'),
    Q('s4', 'switzerland', 'Which can never be part of a Swiss multiple application?', ['Safety-related variations', 'Type IA variations', 'Quality variations', 'Name changes'], 0, 'Safety-related variations cannot be part of a multiple application.', 'Swissmedic Q&A 2.2'),
    Q('s5', 'switzerland', 'How are several variations in one Swiss multiple application processed?', ['On the longest time limit, and completed together', 'Each on its own clock', 'All as Type II', 'All as Type IA'], 0, 'Processing follows the application with the longest time limit; one delayed variation extends the whole group.', 'Swissmedic Q&A 1.25'),
    Q('j1', 'japan', 'In Japan, what decides whether a change needs a partial change approval or a minor change notification?', ['How the item is written in the approval form', 'A list of change types', 'The product\'s age', 'The size of the company'], 0, 'Approved matters need a partial change approval; items marked as minor change items are notified.', 'PMD Act, Article 14'),
    Q('j2', 'japan', 'Within how many days after the change is a minor change notification filed?', ['30', '60', '90', '7'], 0, 'Minor change notifications are filed within 30 days after the change.', 'PMD Act, Article 14'),
    Q('j3', 'japan', 'Which change can never go through the minor route under Article 47?', ['Changing or deleting a specification', 'Adding a packaging site', 'Changing the cap colour', 'Changing equipment of the same design'], 0, 'Article 47(2) excludes deleting items from, and changing, the specification.', 'Enforcement Regulations, Article 47'),
    Q('j4', 'japan', 'When does a change notified under a confirmed change plan (PACMP) become an approved matter?', ['40 working days after acceptance (20 in special cases)', 'Immediately', 'After 12 months', 'After a new approval'], 0, 'MHLW Q&A (2025): notified content becomes approved matters 40 or 20 working days after acceptance.', 'MHLW Q&A, Q7'),
    Q('j5', 'japan', 'What is the 2024 moderate change procedure?', ['A trial of a short review for designated moderate change items', 'A new name for minor change notifications', 'An annual report', 'A GMP inspection'], 0, 'Since September 2024 a trial lets designated moderate-risk items use a rapid review, a form of partial change application.', 'MHLW notice 0927-4 (2024)'),
    Q('w1', 'who', 'Which WHO PQ category needs a letter of acceptance before implementation?', ['Major variation', 'Minor variation', 'Immediate notification', 'Annual notification'], 0, 'Major variations need prior acceptance, signified by a letter of acceptance.', 'TRS 981 Annex 3'),
    Q('w2', 'who', 'When can a WHO PQ minor variation be implemented?', ['If WHO has not started correspondence within 60 days of acknowledgement', 'Immediately', 'After a letter of acceptance', 'After 12 months'], 0, 'The published timeline table: Vmin can be implemented if WHO has not started correspondence within 60 days.', 'PQT timeline table'),
    Q('w3', 'who', 'A change is not listed in the WHO variations guideline. What is it by default?', ['A major variation', 'An annual notification', 'A minor variation', 'Not a variation'], 0, 'Unlisted changes default to major, unless justified as an unclassified minor (u) or agreed with PQT.', 'PQT FAQ, Q8'),
    Q('w4', 'who', 'How should nitrosamine controls be added for a prequalified product?', ['As an immediate notification', 'As a major variation', 'In the annual notification', 'They need no variation'], 0, 'The FAQ says nitrosamine controls should be submitted as an immediate notification.', 'PQT FAQ, 10.1'),
    Q('w5', 'who', 'When is a new manufacturing site a minor variation for WHO PQ?', ['When WHO or a stringent authority inspected it satisfactorily in the last three years', 'Always', 'Never', 'When the site is in the same country'], 0, 'Without such an inspection, the site change is major.', 'PQT FAQ, Q5 and Appendix I'),
    Q('q1', 'q12', 'Under ICH Q12, which changes need a regulatory submission?', ['Changes to established conditions', 'Every change in Module 3', 'Only changes to the label', 'None'], 0, 'Only established conditions are legally binding; supportive information is managed in the quality system.', 'ICH Q12, chapter 3'),
    Q('q2', 'q12', 'How is the reporting category of an established condition set?', ['By the risk of the change: prior approval, moderate or low notification', 'By the size of the company', 'Always prior approval', 'By the number of batches'], 0, 'Q12 links the category to risk: high risk prior approval, lower risk notification.', 'ICH Q12, chapter 3'),
    Q('q3', 'q12', 'What does a PACMP agree in step 1?', ['The planned change, studies, acceptance criteria and proposed category', 'The final approval of the change', 'Only the cover letter', 'A GMP certificate'], 0, 'Step 1 is the protocol; step 2 implements the change and reports it in the agreed category.', 'ICH Q12, chapter 4'),
    Q('q4', 'q12', 'Which document lists the ECs, their categories, the protocols and the CMC commitments?', ['The PLCM document', 'The SmPC', 'The annual report', 'The batch record'], 0, 'The product lifecycle management document collects them (ICH Q12 chapter 5).', 'ICH Q12, chapter 5'),
    Q('q5', 'q12', 'Which region has not implemented established conditions yet (as of 2026)?', ['Canada', 'United States', 'European Union', 'Switzerland'], 0, 'Health Canada starts with PACMPs for biologics; ECs come later.', 'Health Canada ICH Q12 notice'),
    Q('e1', 'q5e', 'What must a Q5E comparability exercise show?', ['The products are highly similar and differences have no adverse impact', 'The products are identical', 'Only that release tests pass', 'That the process is unchanged'], 0, 'Q5E does not require identical products; differences must not adversely affect safety or efficacy.', 'ICH Q5E, 1.4'),
    Q('e2', 'q5e', 'Why are accelerated and stress stability studies useful in comparability?', ['They can reveal subtle differences that release tests miss', 'They replace real-time stability', 'They are required for every change', 'They set the shelf life'], 0, 'Stress and accelerated studies can show differences in degradation pathways.', 'ICH Q5E, 2.2.4'),
    Q('e3', 'q5e', 'When are nonclinical or clinical bridging studies needed?', ['When quality data cannot rule out an impact on safety or efficacy', 'Always', 'Never', 'Only for vaccines'], 0, 'Q5E 2.5: when the quality comparison is not enough, nonclinical or clinical data may be needed.', 'ICH Q5E, 2.5'),
    Q('e4', 'q5e', 'In the EU, a batch size change for a biological active substance that needs a comparability assessment is:', ['Type II', 'Type IA', 'Type IB', 'No variation'], 0, 'Q.I.a.3(c) of the 2025 guidelines.', 'EU guidelines C/2025/5045'),
]

GLOSSARY = [
    {'term': 'Level I supplement (Canada)', 'region': 'Canada', 'def': 'A change with substantial potential to affect the product, filed as an SNDS or SANDS; implemented only after a new Notice of Compliance.'},
    {'term': 'Notifiable change (NC)', 'region': 'Canada', 'def': 'A Level II quality change for biologics and radiopharmaceuticals, implemented after a No Objection Letter; review target 90 days.'},
    {'term': 'Level III notice of change', 'region': 'Canada', 'def': 'A minor change implemented without prior review and then reported with the Level III form.'},
    {'term': 'No Objection Letter (NOL)', 'region': 'Canada', 'def': 'Health Canada\'s letter that allows a notifiable change to be implemented.'},
    {'term': 'Annex 7 TPLRO', 'region': 'Switzerland', 'def': 'The Swiss list of variations, revised from 1 February 2026 and harmonised as far as possible with the EU list.'},
    {'term': 'Multiple application', 'region': 'Switzerland', 'def': 'Several variations for one product filed together and processed on the longest time limit.'},
    {'term': 'Partial change approval', 'region': 'Japan', 'def': 'Approval needed before changing an approved matter in the Japanese approval form.'},
    {'term': 'Minor change notification', 'region': 'Japan', 'def': 'Notification within 30 days after changing an item marked as a minor change item in the approval form.'},
    {'term': 'Approved matters', 'region': 'Japan', 'def': 'The legally binding entries of the Japanese approval form (Module 1.2).'},
    {'term': 'Change plan', 'region': 'Japan', 'def': 'Japan\'s post-approval change management protocol: confirmed in step 1, then changes are notified in step 2.'},
    {'term': 'Immediate notification (IN)', 'region': 'WHO PQ', 'def': 'A change implemented and notified at once; accepted unless WHO objects.'},
    {'term': 'Annual notification (AN)', 'region': 'WHO PQ', 'def': 'A change notified within 12 months of implementation, usually in a yearly group.'},
    {'term': 'Minor variation (Vmin)', 'region': 'WHO PQ', 'def': 'Implemented if WHO has not started correspondence within 60 days of acknowledging it.'},
    {'term': 'Major variation (Vmaj)', 'region': 'WHO PQ', 'def': 'Needs WHO\'s letter of acceptance before implementation.'},
    {'term': 'Established condition (EC)', 'region': 'ICH', 'def': 'A legally binding element of the dossier; changing it needs a regulatory submission in the category set by its risk (ICH Q12).'},
    {'term': 'PLCM document', 'region': 'ICH', 'def': 'The product lifecycle management document: ECs and their reporting categories, protocols and CMC commitments (ICH Q12).'},
    {'term': 'Comparability exercise', 'region': 'ICH', 'def': 'The comparison of a biological product before and after a manufacturing change (ICH Q5E).'},
    {'term': 'Supportive information', 'region': 'ICH', 'def': 'Dossier content that is not an established condition; changes are managed in the quality system.'},
]


def run():
    les = load('lessons.json')
    have = {x['id'] for x in les['lessons']}
    for l in LESSONS:
        if l['id'] not in have:
            les['lessons'].append(l)
    for l in les['lessons']:
        l.setdefault('section', l.get('region') or 'us')
    save(les, 'lessons.json')
    mis = load('missions.json')
    have = {x['id'] for x in mis['missions']}
    for m in MISSIONS:
        if m['id'] not in have:
            mis['missions'].append(m)
    save(mis, 'missions.json')
    qz = load('quiz.json')
    tids = {t['id'] for t in qz['topics']}
    qz['topics'] += [t for t in QUIZ_TOPICS if t['id'] not in tids]
    qids = {x['id'] for x in qz['questions']}
    qz['questions'] += [x for x in QUIZ if x['id'] not in qids]
    save(qz, 'quiz.json')
    gl = load('glossary.json')
    terms = {t['term'] for t in gl['terms']}
    gl['terms'] += [t for t in GLOSSARY if t['term'] not in terms]
    gl['terms'].sort(key=lambda t: t['term'].lower())
    save(gl, 'glossary.json')
    print(len(les['lessons']), 'lessons;', len(mis['missions']), 'missions;', len(qz['questions']), 'questions;', len(gl['terms']), 'terms')


if __name__ == '__main__':
    run()
