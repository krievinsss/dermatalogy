import json,re
from pathlib import Path
root=Path(__file__).resolve().parent
sources={
'T01':('Labdabīgie veidojumi','2.1. nodarbība · 3.–55. slaids'),
'T02':('Ļaundabīgie veidojumi','2.1. nodarbība · 56.–113. slaids'),
'T03':('Noņemšanas metodes','2.2. nodarbība · 2.–14. slaids'),
'T04':('Ādas pH un zonas','3. nodarbība · 2.–4. slaids'),
'T05':('pH un barjerfunkcija','3. nodarbība · 2.–7. slaids'),
'T06':('Ķīmiskie pīlingi','3. nodarbība · 9.–28. slaids'),
'T07':('Pīlingu drošība','3. nodarbība · 14., 20.–23., 29.–38. slaids'),
'T08':('Lāzeru principi','4. nodarbība · 4.–12., 22.–26. slaids'),
'T09':('Lāzeru veidi','4. nodarbība · 13.–21., 27.–28. slaids'),
'T10':('Botulīntoksīna mehānisms','4. nodarbība · 29.–35. slaids'),
'T11':('Botulīntoksīna drošība','4. nodarbība · 33.–47. slaids'),
'T12':('Hialuronskābe ādā','4. nodarbība · 55. slaids + papildteorija'),
'T13':('HA pildvielas un hialuronidāze','4. nodarbība · 55.–56. slaids + papildteorija'),
'T14':('Polinukleotīdi · PN/PDRN','4. nodarbība · 50.–52. slaids'),
'T15':('Eksosomas','4. nodarbība · 53.–54. slaids'),
}
all_questions=[]
for k in (1,2,3):
    src=(root/f'src/data/part{k}.txt').read_text(encoding='utf-8')
    for block in src.split('[')[1:]:
        tag, rest=block.split(']',1)
        if tag not in sources: raise AssertionError('UNKNOWN '+tag)
        for j,line in enumerate([line for line in rest.splitlines() if line.strip()],1):
            fields=[x.strip() for x in line.split(' || ')]
            assert len(fields)==7,(tag,j,len(fields))
            prompt,correct,w1,w2,w3, theory, pearl=fields
            assert all(fields)
            all_questions.append({'id':f'{tag}-{j:02d}', 'topicId':tag, 'topic':sources[tag][0], 'source':sources[tag][1],
                                  'question':prompt, 'options':[correct,w1,w2,w3], 'correctIndex':0,'theory':theory,'takeaway':pearl,
                                  'difficulty': 3 if j>=6 else 2})
# Apply carefully authored, same-domain near-miss distractors to avoid obvious choices.
alt_map={}
for k in (1,2,3):
    p=root/f'src/data/distractors{k}.txt'
    for line in p.read_text(encoding='utf-8').splitlines():
        fields=[x.strip() for x in line.split(' || ')]
        assert len(fields)==4, (p,line[:100])
        question_id,*alternatives=fields
        assert question_id not in alt_map, question_id
        alt_map[question_id]=alternatives
for q in all_questions:
    assert q['id'] in alt_map, q['id']
    q['options']=[q['options'][0],*alt_map[q['id']]]
assert len(alt_map)==225, len(alt_map)
assert len(all_questions)==225,len(all_questions)
for topic in sources:
    assert len([q for q in all_questions if q['topicId']==topic])==15
qsets={}
for q in all_questions:
    if q['question'] in qsets: print('DUPLICATE',q['id'],qsets[q['question']])
    qsets[q['question']]=q['id']
    assert len(set(s.lower() for s in q['options']))==4, q['id']
    assert 80 <= len(q['theory']) <= 700, q['id']
    assert all(len(v)>0 for v in q['options']), q['id']
json_path=root/'src/data/questions.json'
json_path.write_text(json.dumps(all_questions,ensure_ascii=False,indent=2)+'\n', encoding='utf-8')
print('Created',len(all_questions),'questions. JSON size',json_path.stat().st_size)
