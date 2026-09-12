import jsPDF from 'jspdf';
import { Order } from '../types';
import { formatFCFA, formatDate } from '../utils/formatters';
import { SHOWROOM_INFO } from '../data/senegalLocations';

export function generateOrderInvoicePDF(order: Order): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const primaryColor: [number, number, number] = [15, 32, 67]; // Navy blue #0F2043
  const secondaryColor: [number, number, number] = [217, 119, 6]; // Amber #D97706
  const textColor: [number, number, number] = [33, 37, 41];
  const mutedColor: [number, number, number] = [108, 117, 125];

  // Header Banner
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, 210, 38, 'F');

  // Company Name
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text('KHELCOM BUSINESS', 15, 17);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text('Électronique, High-Tech & Électroménager • Nianing (Mbour)', 15, 24);
  doc.text(`Showroom Khelcom Business • Tél : ${SHOWROOM_INFO.phone1} / ${SHOWROOM_INFO.phone2}`, 15, 30);

  // Document Badge (Facture / Devis)
  const isPaid = order.status === 'paid' || order.status === 'delivered';
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(140, 8, 55, 22, 2, 2, 'F');

  doc.setTextColor(...primaryColor);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(isPaid ? 'FACTURE OFFICIELLE' : 'BON DE COMMANDE', 144, 16);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(isPaid ? 16 : 180, isPaid ? 120 : 83, isPaid ? 54 : 9);
  doc.text(isPaid ? 'PAIEMENT VALIDÉ' : 'EN ATTENTE DE PAIEMENT', 144, 23);

  // Order Details Bar
  doc.setFillColor(245, 247, 250);
  doc.rect(15, 45, 180, 24, 'F');
  doc.setDrawColor(220, 225, 230);
  doc.rect(15, 45, 180, 24, 'S');

  doc.setFontSize(9);
  doc.setTextColor(...mutedColor);
  doc.text('Numéro de commande :', 20, 52);
  doc.text('Date d\'émission :', 20, 62);

  doc.text('Mode de livraison :', 110, 52);
  doc.text('Statut du règlement :', 110, 62);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...textColor);
  doc.text(order.orderNumber, 60, 52);
  doc.text(formatDate(order.createdAt), 50, 62);

  const deliveryLabel = order.deliveryType === 'showroom'
    ? 'Retrait Showroom (Gratuit)'
    : order.deliveryType === 'distance_delivery'
    ? `Livraison à Distance (${order.deliveryCity || 'Régions'})`
    : `Livraison Nianing (${order.deliveryCity || 'Nianing'})`;
  doc.text(deliveryLabel.substring(0, 38), 142, 52);

  doc.setTextColor(isPaid ? 16 : 180, isPaid ? 120 : 83, isPaid ? 54 : 9);
  doc.text(isPaid ? 'Validé & Encaissé' : 'En attente de règlement', 148, 62);

  // Client Information Box
  let y = 78;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...primaryColor);
  doc.text('INFORMATIONS CLIENT', 15, y);

  y += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(...textColor);
  doc.text(`Nom / Raison Sociale : ${order.customerName}`, 15, y);
  y += 5;
  doc.text(`Téléphone : ${order.customerPhone}`, 15, y);
  if (order.customerEmail) {
    y += 5;
    doc.text(`Email : ${order.customerEmail}`, 15, y);
  }
  if (order.deliveryType === 'delivery' && order.deliveryAddress) {
    y += 5;
    doc.text(`Adresse de livraison : ${order.deliveryAddress} - ${order.deliveryCity || ''}`, 15, y);
  }

  // Items Table
  y += 12;
  doc.setFillColor(...primaryColor);
  doc.rect(15, y, 180, 8, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('DÉSIGNATION DU PRODUIT & VARIANTES', 18, y + 5.5);
  doc.text('QTÉ', 125, y + 5.5);
  doc.text('PRIX UNIT. (FCFA)', 140, y + 5.5);
  doc.text('TOTAL (FCFA)', 172, y + 5.5);

  y += 8;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);

  order.items.forEach((item, index) => {
    const isEven = index % 2 === 0;
    if (isEven) {
      doc.setFillColor(250, 252, 255);
      doc.rect(15, y, 180, 10, 'F');
    }
    doc.setDrawColor(230, 235, 240);
    doc.line(15, y + 10, 195, y + 10);

    doc.setTextColor(...textColor);
    doc.setFont('helvetica', 'bold');
    doc.text(item.productName.substring(0, 52), 18, y + 4.5);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...mutedColor);
    doc.text(`Variante : ${item.variantTitle.substring(0, 58)}`, 18, y + 8.5);

    doc.setTextColor(...textColor);
    doc.text(item.quantity.toString(), 130, y + 6);
    doc.text(formatFCFA(item.unitPrice).replace(' FCFA', ''), 145, y + 6);
    doc.setFont('helvetica', 'bold');
    doc.text(formatFCFA(item.totalPrice).replace(' FCFA', ''), 172, y + 6);

    y += 10;
  });

  // Summary Box
  y += 6;
  doc.setFillColor(248, 249, 250);
  doc.rect(120, y, 75, 26, 'F');
  doc.setDrawColor(220, 225, 230);
  doc.rect(120, y, 75, 26, 'S');

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...mutedColor);
  doc.text('Sous-total :', 125, y + 6);
  doc.text('Frais de livraison :', 125, y + 13);

  doc.setTextColor(...textColor);
  doc.setFont('helvetica', 'bold');
  doc.text(formatFCFA(order.subtotal), 160, y + 6);
  const deliveryFeeLabel = order.deliveryFeeToBeAgreed 
    ? 'À convenir' 
    : order.deliveryType === 'showroom'
      ? '0 FCFA (Showroom)'
      : order.deliveryFee === 0 
        ? 'GRATUIT' 
        : formatFCFA(order.deliveryFee);
  doc.text(deliveryFeeLabel, 155, y + 13);

  doc.setFillColor(...primaryColor);
  doc.rect(120, y + 18, 75, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9.5);
  doc.text('TOTAL NET (FCFA) :', 123, y + 23.5);
  doc.text(formatFCFA(order.totalAmount), 160, y + 23.5);

  // Left Note: Tax Exemption & Warranty
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...mutedColor);
  doc.text('Note légale & TVA :', 15, y + 6);
  doc.text('• Prix Nets en Francs CFA (XOF) - Régime sans TVA.', 15, y + 11);
  doc.text('• Tous nos produits sont neufs, d\'origine avec garantie constructeur.', 15, y + 16);
  doc.text('• Conservez cette facture pour toute prise en charge sous garantie.', 15, y + 21);

  // Stamp / Validation Box
  y += 36;
  doc.setDrawColor(200, 205, 215);
  doc.roundedRect(15, y, 85, 30, 2, 2, 'S');
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...primaryColor);
  doc.text('SERVICE CLIENT & SHOWROOM', 20, y + 6);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...mutedColor);
  doc.text(SHOWROOM_INFO.address, 20, y + 12);
  doc.text(`Tél / WhatsApp : ${SHOWROOM_INFO.whatsapp}`, 20, y + 17);
  doc.text(`Horaires : ${SHOWROOM_INFO.openingHours}`, 20, y + 22);

  // Official Stamp Box
  doc.setDrawColor(isPaid ? 16 : 200, isPaid ? 120 : 150, isPaid ? 54 : 150);
  doc.roundedRect(110, y, 85, 30, 2, 2, 'S');
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(isPaid ? 16 : 100, isPaid ? 120 : 100, isPaid ? 54 : 100);
  doc.text(isPaid ? 'CACHET & VALIDATION KHELCOM' : 'VISA COMMERCIAL', 115, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  if (isPaid && order.paymentValidatedAt) {
    doc.text(`Encaissé le : ${formatDate(order.paymentValidatedAt)}`, 115, y + 13);
    doc.text(`Validé par : ${order.paymentValidatedBy || 'Direction Commerciale'}`, 115, y + 18);
    doc.text('Matériel délivré conforme - Garanti', 115, y + 23);
  } else {
    doc.text('En attente de règlement au comptoir ou livraison.', 115, y + 14);
    doc.text('Bon pour accord et réservation de stock.', 115, y + 20);
  }

  // Footer
  doc.setFontSize(7.5);
  doc.setTextColor(...mutedColor);
  doc.text('Khelcom Business - Électronique et Électroménager au Sénégal - Document généré automatiquement.', 105, 288, { align: 'center' });

  // Save PDF
  doc.save(`Facture_Khelcom_${order.orderNumber}.pdf`);
}
