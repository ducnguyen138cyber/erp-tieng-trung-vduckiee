"""Pinned machine-reference regressions, not linguistic approval."""
import importlib.util, pathlib, unittest
from pypinyin import pinyin,Style
from pypinyin.contrib.tone_convert import to_tone3
spec=importlib.util.spec_from_file_location('hsk123_phonetics',pathlib.Path(__file__).resolve().parents[1]/'scripts/hsk123-phonetics.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
class Phonetics(unittest.TestCase):
 def test_authored_tones_are_preserved(self):
  parts,_=m.align('门口','ménkǒu');self.assertEqual([to_tone3(p) for p in parts],['men2','kou3'])
 def test_context_is_needed_even_when_every_character_reading_is_possible(self):
  for word,correct,wrong in [('银行','yínháng','yínxíng'),('音乐','yīnyuè','yīnlè'),('睡觉','shuìjiào','shuìjué')]:
   authored,choices=m.align(word,wrong);self.assertIsNotNone(authored)
   context=[p[0] for p in pinyin(word,style=Style.TONE3,neutral_tone_with_five=True)]
   self.assertNotEqual([to_tone3(p,neutral_tone_with_five=True) for p in authored],context)
   self.assertTrue(any(len(readings)>1 for readings in choices))
 def test_erhua_is_never_guessed_into_extra_syllables(self):
  self.assertIsNone(m.align('哪儿','nǎr')[0])
if __name__=='__main__':unittest.main()
