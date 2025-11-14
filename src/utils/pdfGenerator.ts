import PDFDocument from "pdfkit";
import { IUser } from "../models/User";

export const generateResumePDF = async (user: IUser): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: "A4",
        margins: { top: 50, bottom: 50, left: 50, right: 50 },
      });

      const buffers: Buffer[] = [];
      doc.on("data", buffers.push.bind(buffers));
      doc.on("end", () => {
        const pdfBuffer = Buffer.concat(buffers);
        resolve(pdfBuffer);
      });
      doc.on("error", reject);

      // Header
      doc
        .fontSize(24)
        .font("Helvetica-Bold")
        .text(user.name || "Resume", { align: "center" });
      
      doc.moveDown(0.5);
      
      // Contact Information
      doc.fontSize(10).font("Helvetica");
      if (user.email) {
        doc.text(`Email: ${user.email}`, { align: "center" });
      }
      if (user.contactNumber) {
        doc.text(`Phone: ${user.contactNumber}`, { align: "center" });
      }
      if (user.city && user.country) {
        doc.text(`${user.city}, ${user.country}`, { align: "center" });
      } else if (user.city) {
        doc.text(user.city, { align: "center" });
      } else if (user.country) {
        doc.text(user.country, { align: "center" });
      }
      if (user.profileImage) {
        doc.text(`Profile: ${user.profileImage}`, { align: "center" });
      }

      doc.moveDown(1);

      // Personal Details Section
      if (user.dateOfBirth || user.country || user.city) {
        doc.fontSize(14).font("Helvetica-Bold").text("Personal Details");
        doc.moveDown(0.3);
        doc.fontSize(10).font("Helvetica");
        
        if (user.dateOfBirth) {
          const dob = new Date(user.dateOfBirth).toLocaleDateString();
          doc.text(`Date of Birth: ${dob}`);
        }
        if (user.country) {
          doc.text(`Country: ${user.country}`);
        }
        if (user.city) {
          doc.text(`City: ${user.city}`);
        }
        doc.moveDown(0.5);
      }

      // Academic Details Section
      if (
        user.highestQualification ||
        user.fieldOfStudy ||
        user.graduationYear ||
        user.marksOrCGPA ||
        user.targetDegreeInGermany ||
        user.desiredCourseProgram ||
        user.preferredIntake ||
        user.englishProficiency ||
        user.germanLanguageLevel
      ) {
        doc.fontSize(14).font("Helvetica-Bold").text("Academic Details");
        doc.moveDown(0.3);
        doc.fontSize(10).font("Helvetica");
        
        if (user.highestQualification) {
          doc.text(`Highest Qualification: ${user.highestQualification}`);
        }
        if (user.fieldOfStudy) {
          doc.text(`Field of Study: ${user.fieldOfStudy}`);
        }
        if (user.graduationYear) {
          doc.text(`Graduation Year: ${user.graduationYear}`);
        }
        if (user.marksOrCGPA) {
          doc.text(`Marks/CGPA: ${user.marksOrCGPA}`);
        }
        if (user.targetDegreeInGermany) {
          doc.text(`Target Degree in Germany: ${user.targetDegreeInGermany}`);
        }
        if (user.desiredCourseProgram) {
          doc.text(`Desired Course/Program: ${user.desiredCourseProgram}`);
        }
        if (user.preferredIntake) {
          doc.text(`Preferred Intake: ${user.preferredIntake}`);
        }
        if (user.englishProficiency) {
          doc.text(`English Proficiency: ${user.englishProficiency}`);
        }
        if (user.germanLanguageLevel) {
          doc.text(`German Language Level: ${user.germanLanguageLevel}`);
        }
        doc.moveDown(0.5);
      }

      // Professional & Planning Section
      if (user.workExperience || user.estimatedBudget || user.shortlistedUniversities) {
        doc.fontSize(14).font("Helvetica-Bold").text("Professional & Planning");
        doc.moveDown(0.3);
        doc.fontSize(10).font("Helvetica");
        
        if (user.workExperience) {
          doc.text("Work Experience:");
          doc.moveDown(0.2);
          doc.text(user.workExperience, { indent: 20 });
          doc.moveDown(0.3);
        }
        if (user.estimatedBudget) {
          doc.text(`Estimated Budget: ${user.estimatedBudget}`);
        }
        if (user.shortlistedUniversities) {
          doc.text("Shortlisted Universities:");
          doc.moveDown(0.2);
          doc.text(user.shortlistedUniversities, { indent: 20 });
        }
        doc.moveDown(0.5);
      }

      // Areas of Assistance
      if (user.needHelpWith && user.needHelpWith.length > 0) {
        doc.fontSize(14).font("Helvetica-Bold").text("Areas Where I Need Assistance");
        doc.moveDown(0.3);
        doc.fontSize(10).font("Helvetica");
        user.needHelpWith.forEach((item) => {
          doc.text(`• ${item}`, { indent: 20 });
        });
        doc.moveDown(0.5);
      }

      // Footer
      doc
        .fontSize(8)
        .font("Helvetica")
        .text(
          `Generated on: ${new Date().toLocaleDateString()}`,
          { align: "center" }
        );

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

