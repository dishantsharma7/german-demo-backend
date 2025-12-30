import PDFDocument from "pdfkit";
import axios from "axios";
import { IUser } from "../models/User";

export const generateResumePDF = async (user: IUser): Promise<Buffer> => {
  return new Promise(async (resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: "A4",
        margins: { top: 0, bottom: 0, left: 0, right: 0 },
      });

      const buffers: Buffer[] = [];
      doc.on("data", buffers.push.bind(buffers));
      doc.on("end", () => {
        const pdfBuffer = Buffer.concat(buffers);
        resolve(pdfBuffer);
      });
      doc.on("error", reject);

      // Fetch profile image if available
      let profileImageBuffer: Buffer | null = null;
      if (user.profileImage && user.profileImage.startsWith("http")) {
        try {
          const imageResponse = await axios.get(user.profileImage, {
            responseType: "arraybuffer",
            timeout: 10000,
            headers: {
              "User-Agent": "Mozilla/5.0",
            },
          });
          profileImageBuffer = Buffer.from(imageResponse.data);
        } catch (error) {
          console.error("Failed to fetch profile image for PDF:", error);
        }
      }

      const pageWidth = doc.page.width;
      const pageHeight = doc.page.height;
      const leftColumnWidth = pageWidth * 0.35; // 35% for left column
      const rightColumnWidth = pageWidth * 0.65; // 65% for right column
      const leftColumnX = 0;
      const rightColumnX = leftColumnWidth;
      
      // Dark blue color for left column (similar to the image)
      const leftColumnColor = "#1e3a5f"; // Dark blue
      const textColorWhite = "#ffffff";
      const textColorDark = "#1a1a1a";
      const sectionSpacing = 20;
      const sectionPadding = 15;

      // Draw left column background
      doc
        .rect(leftColumnX, 0, leftColumnWidth, pageHeight)
        .fillColor(leftColumnColor)
        .fill();

      // Draw right column background (white)
      doc
        .rect(rightColumnX, 0, rightColumnWidth, pageHeight)
        .fillColor("#ffffff")
        .fill();

      let leftY = 30; // Starting Y position for left column
      let rightY = 30; // Starting Y position for right column

      // ========== LEFT COLUMN ==========
      
      // Profile Image at top left
      if (profileImageBuffer) {
        try {
          const imageSize = 100;
          const imageX = leftColumnX + (leftColumnWidth - imageSize) / 2;
          const imageY = leftY;
          
          // Draw circular image
          doc.save();
          doc.circle(
            leftColumnX + leftColumnWidth / 2,
            leftY + imageSize / 2,
            imageSize / 2
          );
          doc.clip();
          
          doc.image(profileImageBuffer, imageX, imageY, {
            width: imageSize,
            height: imageSize,
            fit: [imageSize, imageSize],
          });
          
          doc.restore();
          
          // Draw border circle
          doc
            .circle(
              leftColumnX + leftColumnWidth / 2,
              leftY + imageSize / 2,
              imageSize / 2
            )
            .lineWidth(3)
            .strokeColor(textColorWhite)
            .stroke();
          
          leftY += imageSize + sectionSpacing;
        } catch (error) {
          console.error("Failed to embed profile image:", error);
        }
      }

      // EXECUTIVE SUMMARY Section (always show, even if empty)
      const summaryStartY = leftY;
      doc
        .fontSize(12)
        .font("Helvetica-Bold")
        .fillColor(textColorWhite)
        .text("EXECUTIVE SUMMARY", leftColumnX + sectionPadding, leftY, {
          width: leftColumnWidth - sectionPadding * 2,
          align: "left",
        });
      leftY += 15;
      
      doc.fontSize(9).font("Helvetica").fillColor(textColorWhite);
      const summaryText = user.desiredCourseProgram 
        ? `I am a ${user.highestQualification || "qualified"} student with a focus on ${user.fieldOfStudy || "my field"}. My goal is to pursue ${user.targetDegreeInGermany || "higher education"} in Germany, specifically in ${user.desiredCourseProgram}.`
        : user.highestQualification 
        ? `I am a ${user.highestQualification} graduate with expertise in ${user.fieldOfStudy || "my field"}.`
        : "Professional seeking opportunities in my field.";
      
      doc.text(summaryText, leftColumnX + sectionPadding, leftY, {
        width: leftColumnWidth - sectionPadding * 2,
        align: "left",
        lineGap: 3,
      });
      leftY += doc.heightOfString(summaryText, {
        width: leftColumnWidth - sectionPadding * 2,
      });
      
      // Ensure minimum height for summary section (maintains section position)
      const minSummaryHeight = 60;
      if (leftY - summaryStartY < minSummaryHeight) {
        leftY = summaryStartY + minSummaryHeight;
      }
      leftY += sectionSpacing;

      // LANGUAGES Section (always show)
      leftY += 10;
      doc
        .fontSize(12)
        .font("Helvetica-Bold")
        .fillColor(textColorWhite)
        .text("LANGUAGES", leftColumnX + sectionPadding, leftY, {
          width: leftColumnWidth - sectionPadding * 2,
        });
      leftY += 15;
      
      doc.fontSize(9).font("Helvetica").fillColor(textColorWhite);
      const languages: string[] = [];
      if (user.englishProficiency) {
        languages.push(`English - ${user.englishProficiency}`);
      }
      if (user.germanLanguageLevel && user.germanLanguageLevel !== "None") {
        languages.push(`German - ${user.germanLanguageLevel}`);
      }
      if (languages.length === 0) {
        languages.push("English - Professional");
      }
      
      languages.forEach((lang) => {
        doc.text(lang, leftColumnX + sectionPadding, leftY, {
          width: leftColumnWidth - sectionPadding * 2,
        });
        leftY += 12;
      });
      leftY += sectionSpacing - 12;

      // HARD SKILLS Section (always show)
      leftY += 10;
      doc
        .fontSize(12)
        .font("Helvetica-Bold")
        .fillColor(textColorWhite)
        .text("HARD SKILLS", leftColumnX + sectionPadding, leftY, {
          width: leftColumnWidth - sectionPadding * 2,
        });
      leftY += 15;
      
      doc.fontSize(9).font("Helvetica").fillColor(textColorWhite);
      const skills = [
        { name: "Academic Excellence", level: user.marksOrCGPA ? 5 : 4 },
        { name: "Language Proficiency", level: user.englishProficiency || user.germanLanguageLevel ? 5 : 3 },
        { name: "Field Expertise", level: user.fieldOfStudy ? 4 : 3 },
        { name: "Research Skills", level: 4 },
        { name: "Communication", level: 4 },
      ];
      
      skills.forEach((skill) => {
        doc.text(skill.name, leftColumnX + sectionPadding, leftY, {
          width: leftColumnWidth - sectionPadding * 2 - 80,
        });
        
        // Draw proficiency circles
        const circleX = leftColumnX + leftColumnWidth - sectionPadding - 70;
        const circleY = leftY + 2;
        const circleRadius = 3;
        const circleSpacing = 6;
        
        for (let i = 0; i < 5; i++) {
          doc
            .circle(circleX + i * circleSpacing, circleY, circleRadius)
            .fillColor(i < skill.level ? textColorWhite : "#4a5568")
            .fill();
        }
        
        leftY += 12;
      });
      leftY += sectionSpacing - 12;

      // VOLUNTEER EXPERIENCE Section (always show, even if empty)
      leftY += 10;
      doc
        .fontSize(12)
        .font("Helvetica-Bold")
        .fillColor(textColorWhite)
        .text("VOLUNTEER EXPERIENCE", leftColumnX + sectionPadding, leftY, {
          width: leftColumnWidth - sectionPadding * 2,
        });
      leftY += 15;
      
      const volunteerStartY = leftY;
      doc.fontSize(9).font("Helvetica").fillColor(textColorWhite);
      // Volunteer experience can be empty - leave space
      if (user.needHelpWith && user.needHelpWith.length > 0) {
        user.needHelpWith.forEach((item) => {
          doc.text(`• ${item}`, leftColumnX + sectionPadding, leftY, {
            width: leftColumnWidth - sectionPadding * 2,
          });
          leftY += 12;
        });
      }
      // Reserve fixed space even if empty (maintains section position)
      const minVolunteerHeight = 30;
      if (leftY - volunteerStartY < minVolunteerHeight) {
        leftY = volunteerStartY + minVolunteerHeight;
      }

      // CERTIFICATES Section (always show)
      leftY += 10;
      doc
        .fontSize(12)
        .font("Helvetica-Bold")
        .fillColor(textColorWhite)
        .text("CERTIFICATES", leftColumnX + sectionPadding, leftY, {
          width: leftColumnWidth - sectionPadding * 2,
        });
      leftY += 15;
      
      const certificatesStartY = leftY;
      doc.fontSize(9).font("Helvetica").fillColor(textColorWhite);
      const certificates: string[] = [];
      if (user.highestQualification) {
        certificates.push(user.highestQualification);
      }
      if (user.englishProficiency) {
        certificates.push(`English: ${user.englishProficiency}`);
      }
      if (user.germanLanguageLevel && user.germanLanguageLevel !== "None") {
        certificates.push(`German: ${user.germanLanguageLevel}`);
      }
      
      if (certificates.length > 0) {
        certificates.forEach((cert) => {
          doc.text(cert, leftColumnX + sectionPadding, leftY, {
            width: leftColumnWidth - sectionPadding * 2,
          });
          leftY += 12;
        });
      }
      
      // Reserve fixed space even if empty (maintains section position)
      const minCertificatesHeight = 30;
      if (leftY - certificatesStartY < minCertificatesHeight) {
        leftY = certificatesStartY + minCertificatesHeight;
      }

      // ========== RIGHT COLUMN ==========
      
      // Name (large, bold)
      rightY = 50;
      doc
        .fontSize(28)
        .font("Helvetica-Bold")
        .fillColor(textColorDark)
        .text((user.name || "Resume").toUpperCase(), rightColumnX + sectionPadding, rightY, {
          width: rightColumnWidth - sectionPadding * 2,
          align: "left",
        });
      rightY += 30;

      // Title/Position
      const title = user.targetDegreeInGermany 
        ? user.targetDegreeInGermany 
        : user.desiredCourseProgram 
        ? user.desiredCourseProgram 
        : user.highestQualification || "Student";
      
      doc
        .fontSize(12)
        .font("Helvetica")
        .fillColor("#4a5568")
        .text(title, rightColumnX + sectionPadding, rightY, {
          width: rightColumnWidth - sectionPadding * 2,
          align: "left",
        });
      rightY += 20;

      // Contact Information
      doc.fontSize(9).font("Helvetica").fillColor(textColorDark);
      if (user.contactNumber) {
        doc.text(`Phone: ${user.contactNumber}`, rightColumnX + sectionPadding, rightY);
        rightY += 12;
      }
      if (user.email) {
        doc.text(`Email: ${user.email}`, rightColumnX + sectionPadding, rightY);
        rightY += 12;
      }
      const location = [];
      if (user.city) location.push(user.city);
      if (user.country) location.push(user.country);
      if (location.length > 0) {
        doc.text(`Location: ${location.join(", ")}`, rightColumnX + sectionPadding, rightY);
        rightY += 12;
      }
      rightY += sectionSpacing;

      // WORK EXPERIENCE Section (always show, even if empty)
      rightY += 10;
      doc
        .fontSize(14)
        .font("Helvetica-Bold")
        .fillColor(textColorDark)
        .text("WORK EXPERIENCE", rightColumnX + sectionPadding, rightY, {
          width: rightColumnWidth - sectionPadding * 2,
        });
      rightY += 20;
      
      doc.fontSize(9).font("Helvetica").fillColor(textColorDark);
      const workExpStartY = rightY;
      if (user.workExperience && user.workExperience.trim() !== "" && user.workExperience.toLowerCase() !== "na") {
        // Format work experience text
        const workExpText = user.workExperience.trim();
        const lines = workExpText.split("\n").filter(line => line.trim());
        
        lines.forEach((line, index) => {
          if (line.trim()) {
            // Check if line looks like a bullet point or description
            const formattedLine = line.trim().startsWith("•") || line.trim().startsWith("-")
              ? line.trim()
              : `• ${line.trim()}`;
            
            doc.text(formattedLine, rightColumnX + sectionPadding + 10, rightY, {
              width: rightColumnWidth - sectionPadding * 2 - 20,
              align: "left",
              lineGap: 1,
            });
            
            const lineHeight = doc.heightOfString(formattedLine, {
              width: rightColumnWidth - sectionPadding * 2 - 20,
            });
            rightY += lineHeight + 3;
          }
        });
        
        // Ensure minimum height for work experience section
        const minWorkExpHeight = 80;
        if (rightY - workExpStartY < minWorkExpHeight) {
          rightY = workExpStartY + minWorkExpHeight;
        }
      } else {
        // Reserve fixed space even if empty (maintains section position)
        rightY += 80;
      }
      rightY += sectionSpacing;

      // EDUCATION Section (always show)
      rightY += 10;
      doc
        .fontSize(14)
        .font("Helvetica-Bold")
        .fillColor(textColorDark)
        .text("EDUCATION", rightColumnX + sectionPadding, rightY, {
          width: rightColumnWidth - sectionPadding * 2,
        });
      rightY += 20;
      
      const educationStartY = rightY;
      doc.fontSize(10).font("Helvetica-Bold").fillColor(textColorDark);
      if (user.highestQualification) {
        const degreeText = `${user.highestQualification.toUpperCase()}${user.fieldOfStudy ? `: ${user.fieldOfStudy.toUpperCase()}` : ""}`;
        doc.text(degreeText, rightColumnX + sectionPadding + 10, rightY, {
          width: rightColumnWidth - sectionPadding * 2 - 20,
        });
        rightY += 12;
      }
      
      doc.fontSize(9).font("Helvetica").fillColor(textColorDark);
      if (user.fieldOfStudy && !user.highestQualification) {
        doc.text(`Field: ${user.fieldOfStudy}`, rightColumnX + sectionPadding + 10, rightY);
        rightY += 12;
      }
      if (user.graduationYear) {
        doc.text(`Graduation Year: ${user.graduationYear}`, rightColumnX + sectionPadding + 10, rightY);
        rightY += 12;
      }
      if (user.marksOrCGPA) {
        doc.text(`Marks/CGPA: ${user.marksOrCGPA}`, rightColumnX + sectionPadding + 10, rightY);
        rightY += 12;
      }
      if (user.targetDegreeInGermany) {
        doc.text(`Target Degree: ${user.targetDegreeInGermany}`, rightColumnX + sectionPadding + 10, rightY);
        rightY += 12;
      }
      if (user.desiredCourseProgram) {
        doc.text(`Desired Program: ${user.desiredCourseProgram}`, rightColumnX + sectionPadding + 10, rightY);
        rightY += 12;
      }
      if (user.preferredIntake) {
        doc.text(`Preferred Intake: ${user.preferredIntake}`, rightColumnX + sectionPadding + 10, rightY);
        rightY += 12;
      }
      
      // Ensure minimum height for education section (maintains section position)
      const minEducationHeight = 60;
      if (rightY - educationStartY < minEducationHeight) {
        rightY = educationStartY + minEducationHeight;
      }
      rightY += sectionSpacing;

      // REFERENCES Section (always show, even if empty)
      rightY += 10;
      doc
        .fontSize(14)
        .font("Helvetica-Bold")
        .fillColor(textColorDark)
        .text("REFERENCES", rightColumnX + sectionPadding, rightY, {
          width: rightColumnWidth - sectionPadding * 2,
        });
      rightY += 20;
      
      const referencesStartY = rightY;
      doc.fontSize(9).font("Helvetica").fillColor(textColorDark);
      // References can be empty - leave space
      if (user.shortlistedUniversities && user.shortlistedUniversities.trim() !== "" && user.shortlistedUniversities.toLowerCase() !== "na") {
        const refLines = user.shortlistedUniversities.split("\n").slice(0, 2);
        refLines.forEach((line) => {
          if (line.trim()) {
            doc.text(line.trim(), rightColumnX + sectionPadding + 10, rightY, {
              width: rightColumnWidth - sectionPadding * 2 - 20,
            });
            rightY += 12;
          }
        });
      }
      // Reserve fixed space even if empty (maintains section position)
      const minReferencesHeight = 40;
      if (rightY - referencesStartY < minReferencesHeight) {
        rightY = referencesStartY + minReferencesHeight;
      }

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

