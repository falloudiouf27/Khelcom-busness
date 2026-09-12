import React, { useState } from 'react';
import { Star, MessageSquare, Check, Sparkles, User, ThumbsUp, Send, Heart, MapPin, Store, CornerDownRight } from 'lucide-react';
import { Product, ProductReview } from '../types';
import { StorageService } from '../services/storage';

interface ProductReviewsSectionProps {
  product: Product;
  onProductUpdated?: (updatedProduct: Product) => void;
}

const RATING_LABELS: Record<number, string> = {
  1: 'Décevant (1/5)',
  2: 'Moyen (2/5)',
  3: 'Bon (3/5)',
  4: 'Très bon (4/5)',
  5: 'Excellent ! (5/5)',
};

const QUICK_TAGS = [
  '⭐️ Qualité irréprochable',
  '⚡ Conforme à la description',
  '🚚 Livraison rapide',
  '💎 Super rapport qualité/prix',
  '👍 Recommandé sans hésiter',
];

export const ProductReviewsSection: React.FC<ProductReviewsSectionProps> = ({
  product,
  onProductUpdated,
}) => {
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [selectedStars, setSelectedStars] = useState<number>(5);
  const [hoveredStars, setHoveredStars] = useState<number | null>(null);
  const [userName, setUserName] = useState<string>('');
  const [comment, setComment] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const reviews: ProductReview[] = product.reviews || [];
  const hasReviews = Boolean(product.rating && product.reviewCount && product.reviewCount > 0 && reviews.length > 0);

  // Rating distribution calculation
  const distribution = [5, 4, 3, 2, 1].map((star) => {
    const count = reviews.filter((r) => Math.round(r.rating) === star).length;
    const percentage = reviews.length > 0 ? Math.round((count / reviews.length) * 100) : 0;
    return { star, count, percentage };
  });

  const handleQuickTagClick = (tag: string) => {
    if (comment.includes(tag)) return;
    setComment((prev) => (prev ? `${prev} • ${tag}` : tag));
  };

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const trimmedName = userName.trim();
    if (!trimmedName) {
      setFormError('Veuillez renseigner votre prénom ou nom.');
      return;
    }

    if (selectedStars < 1 || selectedStars > 5) {
      setFormError('Veuillez sélectionner une note de 1 à 5 étoiles.');
      return;
    }

    setIsSubmitting(true);

    try {
      const result = StorageService.addProductReview(product.id, {
        userName: trimmedName,
        rating: selectedStars,
        comment: comment.trim(),
      });

      if (result.success && result.product) {
        setSuccessMessage('Merci ! Votre avis et votre note ont été enregistrés avec succès.');
        setUserName('');
        setComment('');
        setSelectedStars(5);
        setIsFormOpen(false);

        if (onProductUpdated) {
          onProductUpdated(result.product);
        }

        setTimeout(() => {
          setSuccessMessage(null);
        }, 5000);
      } else {
        setFormError(result.error || 'Impossible d\'enregistrer votre note.');
      }
    } catch {
      setFormError('Une erreur est survenue lors de l\'enregistrement.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentDisplayRating = hoveredStars !== null ? hoveredStars : selectedStars;

  return (
    <div id="product-reviews-section" className="pt-5 border-t border-slate-200/80 space-y-4">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
              <span>Avis & Évaluations Clients</span>
            </h4>
            {hasReviews && (
              <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200/80 text-[10px] font-bold">
                {product.reviewCount} {product.reviewCount! > 1 ? 'avis' : 'avis'}
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Retours et appréciations des acheteurs vérifiés chez Khelcom Business.
          </p>
        </div>

        {!isFormOpen && (
          <button
            type="button"
            id="open-rating-form-btn"
            onClick={() => setIsFormOpen(true)}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-100/90 hover:bg-purple-200 text-purple-900 font-bold text-xs transition-colors cursor-pointer shrink-0 shadow-2xs"
          >
            <Sparkles className="w-3.5 h-3.5 text-orange-500" />
            <span>Noter ce produit</span>
          </button>
        )}
      </div>

      {/* Success Notification */}
      {successMessage && (
        <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-2.5 animate-in fade-in">
          <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
            <Check className="w-3.5 h-3.5" />
          </div>
          <span className="font-semibold">{successMessage}</span>
        </div>
      )}

      {/* RATING SCORE DISPLAY (ONLY IF RATINGS EXIST) */}
      {hasReviews ? (
        <div className="bg-gradient-to-br from-amber-50/60 to-purple-50/40 rounded-2xl p-4 border border-amber-200/60 flex flex-col sm:flex-row items-center gap-5">
          {/* Big Score */}
          <div className="flex flex-col items-center justify-center text-center sm:pr-5 sm:border-r border-amber-200/60 shrink-0">
            <div className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              {product.rating}
              <span className="text-sm font-semibold text-slate-400">/5</span>
            </div>
            <div className="flex items-center gap-0.5 my-1 text-amber-400">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-4 h-4 ${
                    star <= Math.round(product.rating || 0)
                      ? 'fill-amber-400 text-amber-400'
                      : 'text-slate-300 fill-slate-100'
                  }`}
                />
              ))}
            </div>
            <span className="text-[11px] font-semibold text-slate-600">
              {product.reviewCount} évaluation{product.reviewCount! > 1 ? 's' : ''} au total
            </span>
          </div>

          {/* Breakdown bars */}
          <div className="flex-1 w-full space-y-1 text-xs">
            {distribution.map(({ star, count, percentage }) => (
              <div key={star} className="flex items-center gap-2 text-[11px]">
                <span className="w-7 font-bold text-slate-600 flex items-center justify-end gap-0.5">
                  {star} <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400 inline" />
                </span>
                <div className="flex-1 h-2 bg-slate-200/70 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-400 rounded-full transition-all duration-500"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className="w-7 text-right text-slate-400 font-medium">{count}</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* NO RATING: DO NOT DISPLAY ANY RATING SCORE */
        !isFormOpen && (
          <div className="bg-slate-50/80 rounded-2xl p-4 border border-dashed border-slate-200 text-center space-y-2">
            <div className="w-9 h-9 rounded-full bg-purple-100 text-purple-800 mx-auto flex items-center justify-center">
              <MessageSquare className="w-4 h-4 text-purple-700" />
            </div>
            <p className="text-xs font-semibold text-slate-700">
              Ce produit n'a pas encore reçu d'évaluation.
            </p>
            <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
              Soyez le premier client à donner votre avis pour aider la communauté !
            </p>
            <button
              type="button"
              onClick={() => setIsFormOpen(true)}
              className="mt-1 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1b0633] text-orange-400 hover:bg-[#280a4c] font-bold text-xs transition-colors cursor-pointer"
            >
              <Star className="w-3.5 h-3.5 fill-orange-400 text-orange-400" />
              <span>Donner la 1ère note</span>
            </button>
          </div>
        )
      )}

      {/* INTERACTIVE RATING & REVIEW FORM */}
      {isFormOpen && (
        <form
          onSubmit={handleSubmitReview}
          className="bg-purple-50/40 rounded-2xl p-4 sm:p-5 border border-purple-200/80 space-y-4 animate-in fade-in"
        >
          <div className="flex items-center justify-between pb-2 border-b border-purple-100">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-orange-500" />
              <h5 className="font-bold text-xs sm:text-sm text-slate-900">
                Votre évaluation pour {product.name}
              </h5>
            </div>
            <button
              type="button"
              onClick={() => {
                setIsFormOpen(false);
                setFormError(null);
              }}
              className="text-xs text-slate-400 hover:text-slate-600 cursor-pointer font-medium"
            >
              Annuler
            </button>
          </div>

          {formError && (
            <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium">
              {formError}
            </div>
          )}

          {/* Star Selection with Live Hover */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-800 block">
              Attribuez votre note globale <span className="text-rose-500">*</span> :
            </label>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1 bg-white p-1.5 rounded-xl border border-slate-200 shadow-2xs">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setSelectedStars(star)}
                    onMouseEnter={() => setHoveredStars(star)}
                    onMouseLeave={() => setHoveredStars(null)}
                    className="p-1 rounded-lg hover:scale-110 transition-transform cursor-pointer focus:outline-hidden"
                    title={`Donner ${star} étoile(s)`}
                  >
                    <Star
                      className={`w-6 h-6 sm:w-7 sm:h-7 transition-colors ${
                        star <= currentDisplayRating
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-slate-300 fill-slate-100'
                      }`}
                    />
                  </button>
                ))}
              </div>

              <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200/80">
                {RATING_LABELS[currentDisplayRating] || `${currentDisplayRating}/5`}
              </span>
            </div>
          </div>

          {/* User Name Input */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-800 block">
              Votre Prénom & Nom <span className="text-rose-500">*</span> :
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="Ex: Mamadou Diop"
                required
                className="w-full pl-9 pr-3 py-2 text-xs bg-white rounded-xl border border-slate-200 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-hidden font-medium"
              />
            </div>
          </div>

          {/* Quick Sentiment Tags */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-600 block">
              Ajout rapide d'appréciation (cliquez pour ajouter) :
            </label>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_TAGS.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => handleQuickTagClick(tag)}
                  className="px-2.5 py-1 rounded-lg bg-white hover:bg-orange-50 text-slate-700 hover:text-orange-900 border border-slate-200 text-[10px] sm:text-[11px] font-medium transition-colors cursor-pointer"
                >
                  + {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Comment Textarea */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-800 block">
              Votre avis / commentaire (optionnel) :
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Partagez votre expérience avec cet appareil (performances, qualité, livraison, emballage...)"
              rows={3}
              className="w-full p-2.5 text-xs bg-white rounded-xl border border-slate-200 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-hidden font-medium resize-y"
            />
          </div>

          {/* Submit Action */}
          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              id="submit-product-review-btn"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs transition-all shadow-md active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Enregistrement...' : 'Publier mon avis'}</span>
            </button>
          </div>
        </form>
      )}

      {/* REVIEWS LIST */}
      {reviews.length > 0 && (
        <div className="space-y-2.5">
          <h5 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Derniers avis clients vérifiés ({reviews.length}) :
          </h5>

          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {reviews.map((rev) => {
              const formattedDate = new Date(rev.createdAt).toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              });

              const initial = rev.userName ? rev.userName.charAt(0).toUpperCase() : 'C';

              return (
                <div
                  key={rev.id}
                  className={`p-3.5 rounded-2xl border space-y-2 text-xs transition-all ${
                    rev.isFeatured
                      ? 'bg-amber-50/50 border-amber-300 shadow-xs'
                      : 'bg-slate-50/70 border-slate-200/80'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="w-7 h-7 rounded-full bg-purple-900 text-white font-bold text-[10px] flex items-center justify-center shrink-0">
                        {initial}
                      </div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-slate-900">{rev.userName}</span>
                        {rev.userCity && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] text-slate-500 font-medium">
                            <MapPin className="w-2.5 h-2.5 text-orange-500" />
                            {rev.userCity}
                          </span>
                        )}
                        {rev.verifiedPurchase !== false && (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-md bg-emerald-50 text-emerald-800 text-[9px] font-bold border border-emerald-200/60">
                            <Check className="w-2.5 h-2.5 text-emerald-600" /> Achat vérifié
                          </span>
                        )}
                        {rev.isFeatured && (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-md bg-amber-100 text-amber-900 text-[9px] font-black border border-amber-300">
                            <Sparkles className="w-2.5 h-2.5 text-amber-600" /> Mis en avant
                          </span>
                        )}
                      </div>
                    </div>

                    <span className="text-[10px] text-slate-400 shrink-0 font-medium">
                      {formattedDate}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-3 h-3 ${
                          star <= rev.rating
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-slate-300 fill-slate-100'
                        }`}
                      />
                    ))}
                    <span className="text-[11px] font-bold text-slate-700 ml-1">
                      {rev.rating}/5
                    </span>
                  </div>

                  {rev.comment && (
                    <p className="text-slate-700 text-[11px] leading-relaxed pt-0.5 font-normal">
                      "{rev.comment}"
                    </p>
                  )}

                  {/* Official Store Response */}
                  {rev.adminReply && (
                    <div className="mt-2.5 p-2.5 rounded-xl bg-purple-950/5 border border-purple-200/80 space-y-1">
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-purple-900">
                        <CornerDownRight className="w-3 h-3 text-orange-500 shrink-0" />
                        <Store className="w-3 h-3 text-purple-700 shrink-0" />
                        <span>Réponse du Showroom Khelcom Business :</span>
                      </div>
                      <p className="text-[11px] text-purple-950 pl-4 font-medium italic">
                        « {rev.adminReply} »
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
