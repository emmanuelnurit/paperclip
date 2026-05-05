# Checkout — Everything Code augmentation

After a successful checkout (Step 5 in the Paperclip skill):

1. Detect the project ecosystem with `everything_code__setup_pm`.
2. Read the relevant Everything Code skill (`everything_code__load_skill`) for the detected ecosystem before editing.
3. If the issue mentions Symfony or Thelia, prefer the matching skill catalog entry before generic PHP guidance.
