 # plan.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this fe repository.

* Please follow the guidance in the enumerated numbers:

1. This is the FE portion of the application to consume or integrate with BE side.  

2. Create for me an FE Solution using ReactJS with Vite as the framework. Observe
   the 'best practice' and industry standards in initializing and scaffolding the FE structure. I attached
	 a UI Design for you to follow. The image file is located in the /uidesign folder with filename FE_UI_1.png.
   Copy as it is except for the Become Pro Users (box) located in the lower left portion of the UI Design.

3. Create: For the Office Modal - pattern it after the Employee modal. Just change the labelling to reflect it as the Office option - so Add New Office.
Then, include Status and Actions (columns).  So, these are the  titles (labels): (corresponding is the actual fields in the BE) 

   - Office No -> officeNo
	 - Office Name -> officeName
	 - Function of the Office -> function
	 - Location of the Office -> location

You can refactor the code for software reusability - to have a template generic modal to be used based on the selected options on the menu.