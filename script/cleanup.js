print("removing data associated to date: " + mydate);
db.itineraries.find({depart: { $gte: ISODate(mydate + "T00:00:00Z"), $lt:  ISODate(mydate + "T23:59:59Z")}})
  .forEach(function(i) {
    print(" itinerary : " + i._id + " name:" +  i.name + " depart:" + i.depart );
    db.manifests.find({itinerary: i._id})
      .forEach(function(m) { 
         //print("deleting register associated to manifest id=" + m._id); 
         db.registers.find({manifest: m._id})
           .forEach(function(r) { 
             //delete people 
             db.people.remove({_id: r.person});
             print("person :" +  r.person + " removed"); 
             db.registers.remove({_id: r._id}); 
             print("register :" +  r._id + " removed"); 
           })
         db.manifests.remove({_id: m._id});
         print("manifest :" +  m._id + " removed"); 
      })
    db.itineraries.remove({_id: i._id});
    print("itinerary :" +  i._id + " removed"); 
  })
